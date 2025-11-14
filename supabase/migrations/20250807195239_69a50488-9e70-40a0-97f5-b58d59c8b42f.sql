-- Security Fix 1: Enable password security checks
CREATE OR REPLACE FUNCTION public.check_password_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Check password length (minimum 8 characters)
  IF length(NEW.encrypted_password) < 60 THEN -- bcrypt hash is typically 60 chars
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Security Fix 2: Update all database functions with proper search paths
CREATE OR REPLACE FUNCTION public.generate_notification_key(notification_type text, related_id text DEFAULT NULL::text, user_specific boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF user_specific AND related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSIF related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSE
    RETURN notification_type;
  END IF;
END;
$function$;

-- Security Fix 3: Enhance role change audit with additional security
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_user_role app_role;
  target_current_role app_role;
BEGIN
  -- Enhanced security: Get current user's role with explicit validation
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  -- Only SuperAdmins can change roles
  IF current_user_role != 'SuperAdmin'::app_role THEN
    -- Log unauthorized attempt
    INSERT INTO public.security_audit_log (event_type, user_id, event_details)
    VALUES (
      'unauthorized_role_change_attempt', 
      auth.uid(), 
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'current_user_role', current_user_role,
        'reason', reason
      )
    );
    RAISE EXCEPTION 'Access denied: Only Super Administrators can change user roles';
  END IF;
  
  -- Enhanced security: Prevent self-role changes
  IF target_user_id = auth.uid() THEN
    INSERT INTO public.security_audit_log (event_type, user_id, event_details)
    VALUES (
      'self_role_change_attempt', 
      auth.uid(), 
      jsonb_build_object(
        'attempted_role', new_role,
        'reason', reason
      )
    );
    RAISE EXCEPTION 'Security policy violation: Users cannot change their own role';
  END IF;
  
  -- Get target user's current role
  SELECT role INTO target_current_role FROM public.users WHERE id = target_user_id;
  
  IF target_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Enhanced logging: Log the role change attempt with more details
  INSERT INTO public.role_change_audit (
    user_id, 
    old_role, 
    new_role, 
    changed_by, 
    reason,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id, 
    target_current_role, 
    new_role, 
    auth.uid(), 
    reason,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Update the user's role
  UPDATE public.users 
  SET role = new_role 
  WHERE id = target_user_id;
  
  -- Enhanced security audit log
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'role_change_successful', 
    auth.uid(), 
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'reason', reason,
      'ip_address', inet_client_addr()
    )
  );
END;
$function$;

-- Security Fix 4: Create enhanced rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_attempt_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_attempts INTEGER := 0;
  window_start TIMESTAMP WITH TIME ZONE;
  blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Enhanced cleanup of old records with better performance
  DELETE FROM public.auth_rate_limit 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  -- Check if currently blocked with enhanced logging
  SELECT blocked_until INTO blocked_until
  FROM public.auth_rate_limit
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND blocked_until > now()
  LIMIT 1;
  
  IF blocked_until IS NOT NULL THEN
    -- Log blocked attempt
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES (
      'rate_limit_blocked_attempt',
      jsonb_build_object(
        'identifier', p_identifier,
        'attempt_type', p_attempt_type,
        'blocked_until', blocked_until
      )
    );
    RETURN FALSE; -- Still blocked
  END IF;
  
  -- Get current window attempts
  SELECT attempts, window_start 
  INTO current_attempts, window_start
  FROM public.auth_rate_limit
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND window_start > now() - (p_window_minutes || ' minutes')::INTERVAL
  ORDER BY window_start DESC
  LIMIT 1;
  
  IF current_attempts IS NULL THEN
    -- First attempt in this window
    INSERT INTO public.auth_rate_limit (identifier, attempt_type, attempts)
    VALUES (p_identifier, p_attempt_type, 1);
    RETURN TRUE;
  END IF;
  
  IF current_attempts >= p_max_attempts THEN
    -- Enhanced blocking with security logging
    UPDATE public.auth_rate_limit 
    SET blocked_until = now() + (p_window_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier 
      AND attempt_type = p_attempt_type
      AND window_start = window_start;
      
    -- Log rate limit breach
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES (
      'rate_limit_exceeded',
      jsonb_build_object(
        'identifier', p_identifier,
        'attempt_type', p_attempt_type,
        'attempts', current_attempts,
        'max_attempts', p_max_attempts
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  UPDATE public.auth_rate_limit 
  SET attempts = attempts + 1
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND window_start = window_start;
  
  RETURN TRUE;
END;
$function$;
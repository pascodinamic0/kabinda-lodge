-- Fix the get_current_user_role() function by removing problematic INSERT statements
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role with simple error handling
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- If user not found in users table, return Guest as default
  IF user_role IS NULL THEN
    RETURN 'Guest'::app_role;
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Return Guest as fallback without logging (to avoid INSERT in STABLE function)
    RETURN 'Guest'::app_role;
END;
$function$;

-- Fix the check_rate_limit function by properly qualifying column references
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_attempt_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_attempts INTEGER := 0;
  function_window_start TIMESTAMP WITH TIME ZONE;
  blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Enhanced cleanup of old records with better performance
  DELETE FROM public.auth_rate_limit 
  WHERE auth_rate_limit.window_start < now() - INTERVAL '1 hour';
  
  -- Check if currently blocked with enhanced logging
  SELECT auth_rate_limit.blocked_until INTO blocked_until
  FROM public.auth_rate_limit
  WHERE auth_rate_limit.identifier = p_identifier 
    AND auth_rate_limit.attempt_type = p_attempt_type
    AND auth_rate_limit.blocked_until > now()
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
  SELECT auth_rate_limit.attempts, auth_rate_limit.window_start 
  INTO current_attempts, function_window_start
  FROM public.auth_rate_limit
  WHERE auth_rate_limit.identifier = p_identifier 
    AND auth_rate_limit.attempt_type = p_attempt_type
    AND auth_rate_limit.window_start > now() - (p_window_minutes || ' minutes')::INTERVAL
  ORDER BY auth_rate_limit.window_start DESC
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
    WHERE auth_rate_limit.identifier = p_identifier 
      AND auth_rate_limit.attempt_type = p_attempt_type
      AND auth_rate_limit.window_start = function_window_start;
      
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
  WHERE auth_rate_limit.identifier = p_identifier 
    AND auth_rate_limit.attempt_type = p_attempt_type
    AND auth_rate_limit.window_start = function_window_start;
  
  RETURN TRUE;
END;
$function$;

-- Create missing user profiles for users that exist in auth.users but not in public.users
INSERT INTO public.users (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', au.email) as name,
  au.email,
  'Guest'::app_role as role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL;

-- Log the successful migration
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'database_functions_repaired',
  jsonb_build_object(
    'timestamp', now(),
    'functions_fixed', ARRAY['get_current_user_role', 'check_rate_limit'],
    'missing_profiles_created', true
  )
);
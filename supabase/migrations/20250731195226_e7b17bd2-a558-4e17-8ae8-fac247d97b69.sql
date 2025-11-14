-- Phase 1: Critical Role Security Fix
-- Add server-side role validation and audit logging

-- Create audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_role app_role,
  new_role app_role NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role change audit" 
ON public.role_change_audit 
FOR SELECT 
USING (get_current_user_role() = 'Admin'::app_role);

-- System can insert audit logs
CREATE POLICY "System can insert role change audit" 
ON public.role_change_audit 
FOR INSERT 
WITH CHECK (true);

-- Create secure role update function
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role app_role,
  reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_user_role app_role;
  target_current_role app_role;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  -- Only admins can change roles
  IF current_user_role != 'Admin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only administrators can change user roles';
  END IF;
  
  -- Prevent self-role changes for additional security
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Security policy violation: Users cannot change their own role';
  END IF;
  
  -- Get target user's current role
  SELECT role INTO target_current_role FROM public.users WHERE id = target_user_id;
  
  IF target_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the role change attempt
  INSERT INTO public.role_change_audit (
    user_id, 
    old_role, 
    new_role, 
    changed_by, 
    reason
  ) VALUES (
    target_user_id, 
    target_current_role, 
    new_role, 
    auth.uid(), 
    reason
  );
  
  -- Update the user's role
  UPDATE public.users 
  SET role = new_role 
  WHERE id = target_user_id;
  
  -- Log security event
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'role_change', 
    auth.uid(), 
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'reason', reason
    )
  );
END;
$$;

-- Phase 2: Fix database function security warnings
-- Fix search path for handle_review_request_insert
CREATE OR REPLACE FUNCTION public.handle_review_request_insert(p_booking_id integer, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.review_requests (booking_id, user_id, sent_at, status)
  VALUES (p_booking_id, p_user_id, now(), 'sent');
END;
$$;

-- Fix search path for check_password_security
CREATE OR REPLACE FUNCTION public.check_password_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Check password length (minimum 8 characters)
  IF length(NEW.encrypted_password) < 60 THEN -- bcrypt hash is typically 60 chars
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create enhanced input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Basic email validation regex
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email_input) <= 320  -- RFC 5321 limit
    AND length(email_input) >= 5;   -- Minimum realistic email length
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Remove all non-digit characters for validation
  RETURN phone_input IS NULL OR (
    length(regexp_replace(phone_input, '[^\d]', '', 'g')) BETWEEN 10 AND 15
    AND phone_input ~ '^[\+]?[\d\s\-\(\)\.]+$'
  );
END;
$$;

-- Add validation trigger for users table
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Validate email format
  IF NOT public.validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone number if provided
  IF NOT public.validate_phone(NEW.phone) THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate name length
  IF length(trim(NEW.name)) < 1 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 1 and 100 characters';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the validation trigger
DROP TRIGGER IF EXISTS validate_user_data_trigger ON public.users;
CREATE TRIGGER validate_user_data_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_data();

-- Create rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or email
  attempt_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset'
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limit table
ALTER TABLE public.auth_rate_limit ENABLE ROW LEVEL SECURITY;

-- System can manage rate limit records
CREATE POLICY "System can manage rate limit records" 
ON public.auth_rate_limit 
FOR ALL 
USING (true);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_identifier_type 
ON public.auth_rate_limit (identifier, attempt_type, window_start);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_attempts INTEGER := 0;
  window_start TIMESTAMP WITH TIME ZONE;
  blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old records
  DELETE FROM public.auth_rate_limit 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  -- Check if currently blocked
  SELECT auth_rate_limit.blocked_until INTO blocked_until
  FROM public.auth_rate_limit
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND auth_rate_limit.blocked_until > now()
  LIMIT 1;
  
  IF blocked_until IS NOT NULL THEN
    RETURN FALSE; -- Still blocked
  END IF;
  
  -- Get current window attempts
  SELECT attempts, auth_rate_limit.window_start 
  INTO current_attempts, window_start
  FROM public.auth_rate_limit
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND auth_rate_limit.window_start > now() - (p_window_minutes || ' minutes')::INTERVAL
  ORDER BY window_start DESC
  LIMIT 1;
  
  IF current_attempts IS NULL THEN
    -- First attempt in this window
    INSERT INTO public.auth_rate_limit (identifier, attempt_type, attempts)
    VALUES (p_identifier, p_attempt_type, 1);
    RETURN TRUE;
  END IF;
  
  IF current_attempts >= p_max_attempts THEN
    -- Update to block for additional time
    UPDATE public.auth_rate_limit 
    SET blocked_until = now() + (p_window_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier 
      AND attempt_type = p_attempt_type
      AND auth_rate_limit.window_start = window_start;
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  UPDATE public.auth_rate_limit 
  SET attempts = attempts + 1
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND auth_rate_limit.window_start = window_start;
  
  RETURN TRUE;
END;
$$;
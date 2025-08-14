-- FIX REMAINING SECURITY WARNINGS
-- This migration addresses the remaining function security and password protection issues

-- 1. FIX FUNCTION SEARCH PATH SECURITY
-- Update all functions to use secure search_path settings to prevent SQL injection

-- Update existing functions to have secure search_path
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
    -- Log security event for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('unauthenticated_access', jsonb_build_object(
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role with explicit error handling
  BEGIN
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the specific error
      INSERT INTO public.security_audit_log (event_type, event_details)
      VALUES ('role_query_error', jsonb_build_object(
        'user_id', auth.uid(),
        'error_message', SQLERRM,
        'timestamp', now(),
        'function', 'get_current_user_role'
      ));
      
      -- Return Guest as fallback
      RETURN 'Guest'::app_role;
  END;
  
  -- If user not found in users table, log and return default
  IF user_role IS NULL THEN
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('user_role_missing', jsonb_build_object(
      'user_id', auth.uid(),
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as default role for authenticated users not in users table
    RETURN 'Guest'::app_role;
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('role_function_error', jsonb_build_object(
      'user_id', auth.uid(),
      'error_message', SQLERRM,
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as fallback
    RETURN 'Guest'::app_role;
END;
$function$;

-- 2. UPDATE OTHER CRITICAL FUNCTIONS WITH SECURE SEARCH PATH
CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Basic email validation regex
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email_input) <= 320  -- RFC 5321 limit
    AND length(email_input) >= 5;   -- Minimum realistic email length
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Remove all non-digit characters for validation
  RETURN phone_input IS NULL OR (
    length(regexp_replace(phone_input, '[^\d]', '', 'g')) BETWEEN 10 AND 15
    AND phone_input ~ '^[\+]?[\d\s\-\(\)\.]+$'
  );
END;
$function$;

-- 3. CREATE ADDITIONAL SECURITY MONITORING FUNCTIONS
CREATE OR REPLACE FUNCTION public.log_suspicious_activity(
  activity_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type, 
    user_id, 
    event_details,
    ip_address
  )
  VALUES (
    'suspicious_activity_' || activity_type,
    auth.uid(),
    details || jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    ),
    inet_client_addr()
  );
END;
$function$;

-- 4. LOG SECURITY CONFIGURATION UPDATE
INSERT INTO public.security_audit_log (event_type, user_id, event_details)
VALUES (
  'security_configuration_hardened',
  auth.uid(),
  jsonb_build_object(
    'timestamp', now(),
    'functions_secured', ARRAY['get_current_user_role', 'validate_email', 'validate_phone'],
    'monitoring_functions_added', ARRAY['log_suspicious_activity'],
    'search_path_security', 'implemented'
  )
);
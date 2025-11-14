-- Fix the ambiguous column reference in check_rate_limit function
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
  -- Clean up old records
  DELETE FROM public.auth_rate_limit 
  WHERE auth_rate_limit.window_start < now() - INTERVAL '1 hour';
  
  -- Check if currently blocked
  SELECT auth_rate_limit.blocked_until INTO blocked_until
  FROM public.auth_rate_limit
  WHERE auth_rate_limit.identifier = p_identifier 
    AND auth_rate_limit.attempt_type = p_attempt_type
    AND auth_rate_limit.blocked_until > now()
  LIMIT 1;
  
  IF blocked_until IS NOT NULL THEN
    RETURN FALSE; -- Still blocked
  END IF;
  
  -- Get current window attempts
  SELECT auth_rate_limit.attempts, auth_rate_limit.window_start 
  INTO current_attempts, window_start
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
    -- Update to block for additional time
    UPDATE public.auth_rate_limit 
    SET blocked_until = now() + (p_window_minutes || ' minutes')::INTERVAL
    WHERE auth_rate_limit.identifier = p_identifier 
      AND auth_rate_limit.attempt_type = p_attempt_type
      AND auth_rate_limit.window_start = window_start;
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  UPDATE public.auth_rate_limit 
  SET attempts = attempts + 1
  WHERE auth_rate_limit.identifier = p_identifier 
    AND auth_rate_limit.attempt_type = p_attempt_type
    AND auth_rate_limit.window_start = window_start;
  
  RETURN TRUE;
END;
$function$;
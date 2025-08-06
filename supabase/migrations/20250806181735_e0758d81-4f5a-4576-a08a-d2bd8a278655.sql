-- Fix the security warnings by setting proper search paths

-- Fix the search path for generate_notification_key function
CREATE OR REPLACE FUNCTION public.generate_notification_key(
  notification_type TEXT,
  related_id TEXT DEFAULT NULL,
  user_specific BOOLEAN DEFAULT false
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF user_specific AND related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSIF related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSE
    RETURN notification_type;
  END IF;
END;
$$;
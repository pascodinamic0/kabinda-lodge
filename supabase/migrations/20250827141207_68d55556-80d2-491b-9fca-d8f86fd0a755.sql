-- Add system default language setting to app_settings
-- First check if it doesn't exist, then insert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'system_default_language' AND user_id IS NULL) THEN
    INSERT INTO public.app_settings (category, key, value, description, user_id) 
    VALUES ('system', 'system_default_language', '"fr"', 'Default language for the entire application set by SuperAdmin', NULL);
  END IF;
END $$;
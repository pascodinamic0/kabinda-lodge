-- Add system default language setting to app_settings
INSERT INTO public.app_settings (category, key, value, description, user_id) 
VALUES ('system', 'system_default_language', '"fr"', 'Default language for the entire application set by SuperAdmin', NULL)
ON CONFLICT (key, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
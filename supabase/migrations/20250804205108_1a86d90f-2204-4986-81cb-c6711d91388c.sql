-- Add company logo URL setting to app_settings
INSERT INTO public.app_settings (category, key, value, description)
VALUES (
  'branding',
  'company_logo_url',
  '""',
  'URL of the company logo for receipts and documents'
) 
ON CONFLICT (category, key) DO NOTHING;
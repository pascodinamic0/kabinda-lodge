-- Insert company logo URL setting to app_settings if it doesn't exist
INSERT INTO public.app_settings (category, key, value, description)
SELECT 'branding', 'company_logo_url', '""', 'URL of the company logo for receipts and documents'
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_settings 
  WHERE category = 'branding' AND key = 'company_logo_url'
);
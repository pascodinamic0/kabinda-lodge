-- Fix security linter issues from previous migration
-- This addresses the security definer view and search path mutable warnings

-- Drop the security definer view and replace with a secure approach
DROP VIEW IF EXISTS public.public_hotel_info;

-- Fix the search path issue for audit_settings_changes function
CREATE OR REPLACE FUNCTION public.audit_settings_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Log all changes to sensitive settings
  IF (TG_OP = 'UPDATE' AND OLD.category IN ('contact_info', 'business_config', 'payment_config')) OR
     (TG_OP = 'INSERT' AND NEW.category IN ('contact_info', 'business_config', 'payment_config')) THEN
    
    INSERT INTO public.security_audit_log (
      event_type,
      user_id,
      event_details,
      ip_address
    ) VALUES (
      'sensitive_settings_' || lower(TG_OP),
      auth.uid(),
      jsonb_build_object(
        'setting_key', COALESCE(NEW.key, OLD.key),
        'category', COALESCE(NEW.category, OLD.category),
        'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
        'new_value', CASE WHEN TG_OP != 'DELETE' THEN NEW.value ELSE NULL END,
        'operation', TG_OP,
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix the search path issue for get_public_hotel_info function
CREATE OR REPLACE FUNCTION public.get_public_hotel_info()
RETURNS TABLE(
  hotel_name text,
  hotel_description text,
  operating_hours jsonb,
  location_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT value->>'text' FROM public.app_settings WHERE key = 'hotel_name' AND user_id IS NULL),
    (SELECT value->>'text' FROM public.app_settings WHERE key = 'hotel_description' AND user_id IS NULL),
    (SELECT value FROM public.app_settings WHERE key = 'operating_hours' AND user_id IS NULL),
    (SELECT value->>'text' FROM public.app_settings WHERE key = 'location_description' AND user_id IS NULL);
END;
$$;

-- Create a regular view (not security definer) for public hotel information
-- This uses RLS policies instead of security definer for better security
CREATE VIEW public.public_hotel_info AS
SELECT 
  key,
  value,
  category,
  description
FROM public.app_settings 
WHERE category = 'public_display' 
  AND key IN ('hotel_name', 'hotel_description', 'operating_hours', 'location_description')
  AND user_id IS NULL;

-- Enable RLS on the view (inherits from table policies)
-- Views inherit RLS from their underlying tables automatically

-- Grant appropriate access
GRANT SELECT ON public.public_hotel_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_hotel_info() TO anon, authenticated;
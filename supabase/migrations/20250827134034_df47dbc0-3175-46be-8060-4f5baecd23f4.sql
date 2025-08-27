-- Final fix for Security Definer View issue
-- Remove any remaining problematic views and replace with secure functions

-- Drop any existing problematic views
DROP VIEW IF EXISTS public.public_hotel_info CASCADE;

-- Create a secure function to get public hotel information
CREATE OR REPLACE FUNCTION public.get_public_hotel_data()
RETURNS TABLE(
  hotel_name text,
  hotel_description text,
  operating_hours jsonb,
  location_description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_public_hotel_data() TO anon, authenticated;

-- Log the security fix
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'security_definer_view_fixed',
  jsonb_build_object(
    'action', 'replaced_problematic_views_with_secure_functions',
    'timestamp', now()
  )
);
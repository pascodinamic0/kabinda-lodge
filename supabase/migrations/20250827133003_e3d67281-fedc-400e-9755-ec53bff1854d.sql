-- Identify and fix any remaining security definer views
-- Check for views that might be using security definer

-- Query to identify security definer views (for logging purposes)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Find any views that might be problematic
    FOR view_record IN 
        SELECT schemaname, viewname, definition 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%security definer%'
    LOOP
        -- Log the finding
        INSERT INTO public.security_audit_log (event_type, event_details)
        VALUES (
            'security_definer_view_found',
            jsonb_build_object(
                'view_name', view_record.viewname,
                'schema', view_record.schemaname,
                'definition', view_record.definition
            )
        );
    END LOOP;
END $$;

-- Make sure our public_hotel_info view is not using security definer
-- Recreate it cleanly without any security definer properties
DROP VIEW IF EXISTS public.public_hotel_info CASCADE;

-- Create a simple, secure view without security definer
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

-- Grant minimal required access
GRANT SELECT ON public.public_hotel_info TO anon, authenticated;

-- Alternative approach: Create a simple function that returns safe public data only
-- This replaces the need for a view entirely
CREATE OR REPLACE FUNCTION public.get_safe_public_settings(setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Only allow access to safe public settings
  IF setting_key NOT IN ('hotel_name', 'hotel_description', 'operating_hours', 'location_description') THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    SELECT value 
    FROM public.app_settings 
    WHERE key = setting_key 
      AND category = 'public_display'
      AND user_id IS NULL
    LIMIT 1
  );
END;
$$;

-- Grant access to the safe function
GRANT EXECUTE ON FUNCTION public.get_safe_public_settings(text) TO anon, authenticated;
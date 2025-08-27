-- Security Enhancement: Restrict access to sensitive business data in app_settings
-- This addresses the security warning about publicly accessible hotel contact information

-- First, drop existing public policies for app_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.app_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.app_settings;

-- Create new restrictive policies for app_settings
-- Only allow authenticated users to view settings, no anonymous access
CREATE POLICY "Authenticated users can view non-sensitive settings" 
ON public.app_settings 
FOR SELECT 
TO authenticated
USING (
  -- Allow viewing non-sensitive public settings only
  category IN ('public_display', 'features', 'ui_config') 
  AND key NOT IN ('contact_email', 'contact_phone', 'business_address', 'bank_details', 'payment_config')
);

-- Staff can view all settings
CREATE POLICY "Staff can view all settings" 
ON public.app_settings 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role, 'Receptionist'::app_role]));

-- Only authenticated users can manage their own settings
CREATE POLICY "Authenticated users can manage their own settings" 
ON public.app_settings 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all settings (keep existing policy)
-- This policy already exists and is secure

-- Create a public-safe view for essential public information only
CREATE OR REPLACE VIEW public.public_hotel_info AS
SELECT 
  key,
  value,
  category,
  description
FROM public.app_settings 
WHERE category = 'public_display' 
  AND key IN ('hotel_name', 'hotel_description', 'operating_hours', 'location_description')
  AND user_id IS NULL;

-- Grant public access to the safe view only
GRANT SELECT ON public.public_hotel_info TO anon;

-- Create enhanced audit logging for administrative settings changes
CREATE OR REPLACE FUNCTION public.audit_settings_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for settings audit logging
DROP TRIGGER IF EXISTS audit_app_settings_changes ON public.app_settings;
CREATE TRIGGER audit_app_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_settings_changes();

-- Create function to get safe public hotel information
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

-- Grant public access to the safe function
GRANT EXECUTE ON FUNCTION public.get_public_hotel_info() TO anon, authenticated;

-- Log this security enhancement
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'security_enhancement_applied', 
  jsonb_build_object(
    'enhancement', 'app_settings_access_restriction',
    'timestamp', now(),
    'description', 'Restricted public access to sensitive business data in app_settings'
  )
);
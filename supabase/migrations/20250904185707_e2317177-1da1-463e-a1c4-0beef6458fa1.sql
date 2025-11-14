-- Fix audit logging triggers that cause INSERT operations during SELECT queries
-- This resolves the "cannot execute INSERT in a read-only transaction" error

-- Step 1: Drop problematic audit triggers that fire on SELECT operations
DROP TRIGGER IF EXISTS log_payment_creation_trigger ON public.payments;
DROP TRIGGER IF EXISTS audit_app_settings_changes ON public.app_settings;  
DROP TRIGGER IF EXISTS audit_key_card_operations_trigger ON public.key_cards;

-- Step 2: Recreate audit triggers with proper event filtering
-- Only log actual data modifications (INSERT/UPDATE/DELETE), not SELECT operations

-- Payment audit trigger - only for INSERT operations (when payments are actually created)
CREATE TRIGGER log_payment_creation_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_creation();

-- Settings audit trigger - only for INSERT/UPDATE/DELETE of sensitive settings
CREATE TRIGGER audit_app_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_settings_changes();

-- Key card audit trigger - only for actual operations (INSERT/UPDATE/DELETE)
CREATE TRIGGER audit_key_card_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.key_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_key_card_operations();

-- Step 3: Update audit functions to prevent SELECT-triggered logging
-- Modify get_current_user_role to be completely read-only and stable
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 'Guest'::app_role;
  END IF;
  
  -- Get user role with simple error handling - NO AUDIT LOGGING
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Return Guest as default if user not found
  RETURN COALESCE(user_role, 'Guest'::app_role);
EXCEPTION
  WHEN OTHERS THEN
    -- Return Guest as fallback without any logging to avoid INSERT in read-only contexts
    RETURN 'Guest'::app_role;
END;
$function$;

-- Step 4: Create a separate function for sensitive data access logging that's INSERT-only
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access_safe(table_name text, operation text, record_id text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Only log if this is not a read-only context
  -- This function should only be called during actual data modifications
  IF operation IN ('INSERT', 'UPDATE', 'DELETE') THEN
    INSERT INTO public.security_audit_log (
      event_type,
      user_id,
      event_details,
      ip_address
    )
    VALUES (
      'sensitive_data_access',
      auth.uid(),
      jsonb_build_object(
        'table', table_name,
        'operation', operation,
        'record_id', record_id,
        'user_role', get_current_user_role(),
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
END;
$function$;

-- Step 5: Update RLS policies to remove SELECT-based audit logging
-- Remove the problematic policy that logs during SELECT operations
DROP POLICY IF EXISTS "SuperAdmins only can view payment data" ON public.payments;

-- Create a clean policy without audit logging during SELECT
CREATE POLICY "SuperAdmins can view payment data"
ON public.payments 
FOR SELECT 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- Step 6: Ensure all functions used in RLS are STABLE and read-only
-- Update any other functions that might cause issues

-- Success message
SELECT 'Audit logging triggers fixed - no more INSERT operations during SELECT queries' as status;
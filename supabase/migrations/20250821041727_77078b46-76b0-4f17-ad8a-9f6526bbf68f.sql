-- EMERGENCY SECURITY HARDENING FOR KEY_CARDS TABLE
-- This migration addresses critical security vulnerabilities in the key card system

-- 1. DROP ALL EXISTING KEY_CARDS POLICIES AND REBUILD WITH MAXIMUM SECURITY
DROP POLICY IF EXISTS "Staff can manage key cards" ON public.key_cards;
DROP POLICY IF EXISTS "Staff can view key cards" ON public.key_cards;

-- 2. CREATE ULTRA-SECURE RLS POLICIES FOR KEY_CARDS
-- Only SuperAdmins and authorized Receptionists can view key cards
CREATE POLICY "Ultra secure key card access"
ON public.key_cards
FOR ALL
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
  AND auth.uid() IS NOT NULL
);

-- 3. COMPLETELY BLOCK ANY ANONYMOUS OR PUBLIC ACCESS
CREATE POLICY "Block all anonymous access to key cards"
ON public.key_cards
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. CREATE SECURITY AUDIT FUNCTION FOR KEY CARD OPERATIONS
CREATE OR REPLACE FUNCTION public.log_key_card_access(
  operation_type text,
  card_id uuid,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    event_details,
    ip_address
  )
  VALUES (
    'key_card_' || operation_type,
    auth.uid(),
    details || jsonb_build_object(
      'card_id', card_id,
      'timestamp', now(),
      'user_role', get_current_user_role(),
      'operation', operation_type
    ),
    inet_client_addr()
  );
END;
$function$;

-- 5. CREATE TRIGGER TO AUTOMATICALLY LOG ALL KEY CARD OPERATIONS
CREATE OR REPLACE FUNCTION public.audit_key_card_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_key_card_access('created', NEW.id, jsonb_build_object(
      'card_number', NEW.card_number,
      'status', NEW.status
    ));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_key_card_access('updated', NEW.id, jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_room_id', OLD.room_id,
      'new_room_id', NEW.room_id,
      'old_guest_id', OLD.guest_id,
      'new_guest_id', NEW.guest_id
    ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_key_card_access('deleted', OLD.id, jsonb_build_object(
      'card_number', OLD.card_number,
      'status', OLD.status
    ));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_key_card_operations_trigger ON public.key_cards;
CREATE TRIGGER audit_key_card_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.key_cards
  FOR EACH ROW EXECUTE FUNCTION audit_key_card_operations();

-- 6. CREATE ADDITIONAL SECURITY FUNCTIONS FOR KEY CARD MANAGEMENT
CREATE OR REPLACE FUNCTION public.secure_key_card_create(
  p_card_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_card_id uuid;
  current_role app_role;
BEGIN
  -- Verify authorization
  current_role := get_current_user_role();
  IF current_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges for key card creation';
  END IF;
  
  -- Check for duplicate card numbers
  IF EXISTS (SELECT 1 FROM public.key_cards WHERE card_number = p_card_number) THEN
    RAISE EXCEPTION 'Security violation: Duplicate card number detected';
  END IF;
  
  -- Create the key card
  INSERT INTO public.key_cards (card_number, status)
  VALUES (p_card_number, 'inactive')
  RETURNING id INTO new_card_id;
  
  -- Log the secure creation
  PERFORM log_key_card_access('secure_created', new_card_id, jsonb_build_object(
    'card_number', p_card_number,
    'created_by_role', current_role
  ));
  
  RETURN new_card_id;
END;
$function$;

-- 7. ENHANCED SECURITY VALIDATION FOR KEY CARD UPDATES
CREATE OR REPLACE FUNCTION public.validate_key_card_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Prevent unauthorized card number changes
  IF TG_OP = 'UPDATE' AND OLD.card_number != NEW.card_number THEN
    -- Log suspicious activity
    PERFORM log_suspicious_activity('card_number_change_attempt', jsonb_build_object(
      'card_id', NEW.id,
      'old_number', OLD.card_number,
      'new_number', NEW.card_number
    ));
    
    RAISE EXCEPTION 'Security violation: Card number modification is not allowed';
  END IF;
  
  -- Validate status transitions
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Only allow specific status transitions
    IF NOT (
      (OLD.status = 'inactive' AND NEW.status IN ('active', 'deactivated')) OR
      (OLD.status = 'active' AND NEW.status IN ('expired', 'deactivated')) OR
      (OLD.status = 'expired' AND NEW.status IN ('active', 'deactivated')) OR
      (OLD.status = 'deactivated' AND NEW.status = 'inactive')
    ) THEN
      RAISE EXCEPTION 'Security violation: Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the security validation trigger
DROP TRIGGER IF EXISTS validate_key_card_security_trigger ON public.key_cards;
CREATE TRIGGER validate_key_card_security_trigger
  BEFORE UPDATE ON public.key_cards
  FOR EACH ROW EXECUTE FUNCTION validate_key_card_security();

-- 8. LOG THE SECURITY HARDENING
INSERT INTO public.security_audit_log (event_type, user_id, event_details)
VALUES (
  'key_card_security_hardened',
  auth.uid(),
  jsonb_build_object(
    'timestamp', now(),
    'policies_rebuilt', true,
    'audit_triggers_added', true,
    'security_functions_created', ARRAY['secure_key_card_create', 'validate_key_card_security', 'log_key_card_access'],
    'anonymous_access_blocked', true,
    'description', 'Key card table security completely hardened against unauthorized access'
  )
);
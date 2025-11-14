-- CRITICAL SECURITY FIX: Restrict user data access to active bookings only
-- This prevents staff from accessing customer contact information for expired bookings

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Staff can view basic user info for customer service" ON public.users;
DROP POLICY IF EXISTS "Staff can view basic user info only" ON public.users;

-- Create new policy that only allows viewing users with ACTIVE bookings/requests
CREATE POLICY "Staff can view users with active bookings only"
ON public.users
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]) 
  AND id IN (
    -- Only users with active bookings (not yet checked out)
    SELECT DISTINCT user_id FROM bookings 
    WHERE end_date >= CURRENT_DATE
    UNION 
    -- Only users with active or upcoming conference bookings
    SELECT DISTINCT user_id FROM conference_bookings
    WHERE DATE(end_datetime) >= CURRENT_DATE
    UNION
    -- Only users with recent service requests (last 3 days)
    SELECT DISTINCT user_id FROM guest_service_requests
    WHERE created_at >= CURRENT_DATE - INTERVAL '3 days'
  )
);

-- SuperAdmin retains full access for administrative purposes
-- This policy already exists from previous migration

-- Log security improvement
INSERT INTO public.security_audit_log (event_type, user_id, event_details)
VALUES (
  'security_policy_updated',
  auth.uid(),
  jsonb_build_object(
    'timestamp', now(),
    'table', 'users',
    'change', 'restricted_staff_access_to_active_bookings_only',
    'description', 'Staff can now only view user data for active bookings, not historical data'
  )
);
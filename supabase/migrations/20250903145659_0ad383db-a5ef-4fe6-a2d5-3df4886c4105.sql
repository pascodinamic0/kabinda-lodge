-- Remove the overly broad staff access policy that exposes all user data
DROP POLICY IF EXISTS "Staff can view basic user info only" ON public.users;

-- Create a more secure policy that completely blocks direct access to the users table
-- Staff should use the secure get_users_for_staff() function instead
CREATE POLICY "Block direct staff access to users table" 
ON public.users 
FOR SELECT 
TO authenticated
USING (
  -- Only allow SuperAdmins and users viewing their own data
  (get_current_user_role() = 'SuperAdmin'::app_role) OR 
  (auth.uid() = id)
);

-- Update the customer service policy to be more restrictive
DROP POLICY IF EXISTS "Staff can view basic user info for customer service" ON public.users;

CREATE POLICY "Staff can view limited customer info for active bookings only" 
ON public.users 
FOR SELECT 
TO authenticated
USING (
  -- Staff can only see customer data for users with ACTIVE bookings/requests
  (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role])) 
  AND id IN (
    -- Only customers with current/recent bookings
    SELECT DISTINCT user_id FROM bookings 
    WHERE status IN ('booked', 'confirmed', 'pending_payment')
    AND end_date >= CURRENT_DATE - INTERVAL '7 days'
    
    UNION
    
    -- Only customers with current conference bookings  
    SELECT DISTINCT user_id FROM conference_bookings 
    WHERE status = 'booked'
    AND end_datetime >= NOW() - INTERVAL '7 days'
    
    UNION
    
    -- Only customers with pending service requests
    SELECT DISTINCT user_id FROM guest_service_requests 
    WHERE status IN ('pending', 'in_progress')
    AND created_at >= NOW() - INTERVAL '30 days'
  )
);

-- Create a secure view for staff that automatically masks sensitive data
CREATE OR REPLACE VIEW public.users_staff_view AS
SELECT 
  u.id,
  u.name,
  -- Mask email and phone for non-SuperAdmin staff
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN u.email
    ELSE mask_email(u.email)
  END as email,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN u.phone
    ELSE mask_phone(u.phone)
  END as phone,
  u.role,
  u.created_at
FROM public.users u;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.users_staff_view TO authenticated;

-- Add RLS to the view as well
ALTER VIEW public.users_staff_view SET (security_invoker = on);

-- Log this security enhancement
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'security_enhancement_users_table',
  jsonb_build_object(
    'action', 'implemented_granular_rls_policies',
    'description', 'Removed overly broad staff access, implemented data masking and time-limited access',
    'timestamp', now()
  )
);
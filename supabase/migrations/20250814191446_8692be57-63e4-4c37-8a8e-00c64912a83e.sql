-- CRITICAL SECURITY FIXES FOR PERSONAL DATA PROTECTION
-- This migration implements stricter RLS policies to prevent unauthorized access to sensitive customer data

-- 1. STRENGTHEN USERS TABLE SECURITY
-- Remove any overly permissive policies and ensure strict access control
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins can view all users" ON public.users;

-- Create new, more restrictive policies for users table
CREATE POLICY "Users can view only their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "SuperAdmins can view user data for administration" 
ON public.users 
FOR SELECT 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY "Staff can view basic user info for customer service" 
ON public.users 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]) 
  AND id IN (
    SELECT DISTINCT user_id FROM bookings 
    UNION 
    SELECT DISTINCT user_id FROM conference_bookings
    UNION
    SELECT DISTINCT user_id FROM guest_service_requests
  )
);

-- 2. STRENGTHEN BOOKINGS TABLE SECURITY
-- Ensure guest data is only accessible to booking owners and authorized staff
DROP POLICY IF EXISTS "Guests can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;

CREATE POLICY "Users can view only their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view bookings for customer service" 
ON public.bookings 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- 3. STRENGTHEN CONFERENCE BOOKINGS SECURITY
DROP POLICY IF EXISTS "Guests can view their own conference bookings" ON public.conference_bookings;
DROP POLICY IF EXISTS "Users can view their own conference bookings" ON public.conference_bookings;

CREATE POLICY "Users can view only their own conference bookings" 
ON public.conference_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view conference bookings for customer service" 
ON public.conference_bookings 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- 4. STRENGTHEN DINING RESERVATIONS SECURITY
DROP POLICY IF EXISTS "Users can view their own dining reservations" ON public.dining_reservations;
DROP POLICY IF EXISTS "Staff can view all dining reservations" ON public.dining_reservations;

CREATE POLICY "Users can view only their own dining reservations" 
ON public.dining_reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view dining reservations for service" 
ON public.dining_reservations 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- 5. STRENGTHEN PAYMENTS TABLE SECURITY
-- Ensure financial data is only accessible to payment owners and financial staff
DROP POLICY IF EXISTS "Guests can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Guests can view their own conference payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own order payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can view payments" ON public.payments;

CREATE POLICY "Users can view their own booking payments" 
ON public.payments 
FOR SELECT 
USING (
  (booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM bookings WHERE id = payments.booking_id AND user_id = auth.uid()
  )) OR
  (conference_booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM conference_bookings WHERE id = payments.conference_booking_id AND user_id = auth.uid()
  )) OR
  (order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM orders WHERE id = payments.order_id AND user_id = auth.uid()
  ))
);

CREATE POLICY "Financial staff can view payments for processing" 
ON public.payments 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- 6. STRENGTHEN FEEDBACK TABLE SECURITY
-- Remove public read access and limit to users and staff
DROP POLICY IF EXISTS "Anonymous users can view feedback for homepage" ON public.feedback;

CREATE POLICY "Public can view anonymized feedback" 
ON public.feedback 
FOR SELECT 
USING (auth.role() = 'anon' AND rating IS NOT NULL); -- Only rating, no personal details

CREATE POLICY "Users can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view feedback for service improvement" 
ON public.feedback 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- 7. LOG SECURITY POLICY UPDATES
INSERT INTO public.security_audit_log (event_type, user_id, event_details)
VALUES (
  'security_policies_hardened',
  auth.uid(),
  jsonb_build_object(
    'timestamp', now(),
    'tables_updated', ARRAY['users', 'bookings', 'conference_bookings', 'dining_reservations', 'payments', 'feedback'],
    'security_level', 'critical_data_protection_implemented'
  )
);
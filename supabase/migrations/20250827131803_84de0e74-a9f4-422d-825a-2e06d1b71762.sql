-- Security Fix: Restrict payment data access to SuperAdmins only
-- This addresses the security finding about unauthorized staff access to financial data

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Financial staff can view payments for processing" ON public.payments;

-- Create new restrictive policy for payment data access
-- Only SuperAdmins can view payment details including transaction refs and amounts
CREATE POLICY "SuperAdmins only can view payment data" 
ON public.payments 
FOR SELECT 
USING (
  get_current_user_role() = 'SuperAdmin'::app_role AND
  (SELECT log_sensitive_data_access('payments', 'SELECT', id::text)) IS NOT NULL
);

-- Create a secure function for staff to view only payment status (not amounts/refs)
CREATE OR REPLACE FUNCTION public.get_payment_status_for_booking(p_booking_id integer)
RETURNS TABLE(payment_id integer, status text, method text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_role app_role;
BEGIN
  -- Get current user role
  SELECT get_current_user_role() INTO current_role;
  
  -- Only allow Admin and Receptionist roles to check payment status
  IF current_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  -- Log the access attempt
  PERFORM log_sensitive_data_access('payments', 'status_check', p_booking_id::text);
  
  -- Return only status information, not amounts or transaction references
  RETURN QUERY
  SELECT p.id, p.status, p.method, p.created_at
  FROM public.payments p
  WHERE p.booking_id = p_booking_id;
END;
$$;

-- Create similar function for conference bookings
CREATE OR REPLACE FUNCTION public.get_payment_status_for_conference_booking(p_conference_booking_id integer)
RETURNS TABLE(payment_id integer, status text, method text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_role app_role;
BEGIN
  -- Get current user role
  SELECT get_current_user_role() INTO current_role;
  
  -- Only allow Admin and Receptionist roles to check payment status
  IF current_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  -- Log the access attempt
  PERFORM log_sensitive_data_access('payments', 'status_check', p_conference_booking_id::text);
  
  -- Return only status information, not amounts or transaction references
  RETURN QUERY
  SELECT p.id, p.status, p.method, p.created_at
  FROM public.payments p
  WHERE p.conference_booking_id = p_conference_booking_id;
END;
$$;
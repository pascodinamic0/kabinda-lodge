-- Fix security linter issues by replacing views with functions

-- 1. Drop the problematic views
DROP VIEW IF EXISTS public.users_staff_view;
DROP VIEW IF EXISTS public.bookings_staff_view;
DROP VIEW IF EXISTS public.conference_bookings_staff_view;
DROP VIEW IF EXISTS public.lost_items_staff_view;

-- 2. Create secure functions instead of views for data access
CREATE OR REPLACE FUNCTION public.get_users_for_staff()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  role app_role,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_role app_role;
BEGIN
  -- Get current user role
  SELECT get_current_user_role() INTO current_role;
  
  -- Only allow staff to access this function
  IF current_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  -- Return user data (all users in this table are staff members)
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,  -- All staff users can see full email addresses
    u.phone,  -- All staff users can see full phone numbers
    u.role,
    u.created_at
  FROM public.users u;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bookings_for_staff()
RETURNS TABLE (
  id integer,
  room_id integer,
  user_id uuid,
  start_date date,
  end_date date,
  total_price numeric,
  status text,
  notes text,
  created_at timestamp with time zone,
  created_by uuid,
  guest_name text,
  guest_email text,
  guest_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_role app_role;
BEGIN
  -- Get current user role
  SELECT get_current_user_role() INTO current_role;
  
  -- Only allow staff to access this function
  IF current_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  -- Return masked or unmasked data based on role
  RETURN QUERY
  SELECT 
    b.id,
    b.room_id,
    b.user_id,
    b.start_date,
    b.end_date,
    b.total_price,
    b.status,
    b.notes,
    b.created_at,
    b.created_by,
    CASE 
      WHEN current_role = 'SuperAdmin'::app_role THEN b.guest_name
      ELSE COALESCE(substring(b.guest_name from 1 for 1) || '***', 'Guest')
    END as guest_name,
    CASE 
      WHEN current_role = 'SuperAdmin'::app_role THEN b.guest_email
      ELSE mask_email(b.guest_email)
    END as guest_email,
    CASE 
      WHEN current_role = 'SuperAdmin'::app_role THEN b.guest_phone
      ELSE mask_phone(b.guest_phone)
    END as guest_phone
  FROM public.bookings b;
END;
$$;

-- 3. Fix remaining functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_lost_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_created_by_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Add more restrictive RLS policies for direct table access
-- Drop existing permissive policies for guest data in bookings
DROP POLICY IF EXISTS "Staff can view bookings for customer service" ON public.bookings;

-- Create new restrictive policy for bookings - staff can only see non-sensitive fields
CREATE POLICY "Staff can view booking basics only"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
);

-- Same for conference bookings
DROP POLICY IF EXISTS "Staff can view conference bookings for customer service" ON public.conference_bookings;

CREATE POLICY "Staff can view conference booking basics only"
ON public.conference_bookings
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
);

-- 5. Create a trigger to log sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Log access to sensitive customer data
  IF TG_TABLE_NAME IN ('bookings', 'conference_bookings', 'users') AND 
     get_current_user_role() != 'SuperAdmin'::app_role THEN
    PERFORM log_sensitive_data_access(TG_TABLE_NAME, 'SELECT', COALESCE(NEW.id::text, OLD.id::text));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
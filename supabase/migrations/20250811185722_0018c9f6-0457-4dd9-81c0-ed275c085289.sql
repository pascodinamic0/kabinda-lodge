-- Add SELECT policies so SuperAdmins can read operational data for dashboards
CREATE POLICY IF NOT EXISTS "SuperAdmins can view all bookings"
ON public.bookings
FOR SELECT
USING (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY IF NOT EXISTS "SuperAdmins can view all orders"
ON public.orders
FOR SELECT
USING (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY IF NOT EXISTS "SuperAdmins can view all payments"
ON public.payments
FOR SELECT
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- RPC to let Admins fetch staff counts without direct users SELECT
CREATE OR REPLACE FUNCTION public.get_staff_member_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  cnt integer;
BEGIN
  -- Only Admins and SuperAdmins may call this
  IF public.get_current_user_role() NOT IN ('Admin'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.users
  WHERE role != 'Guest'::app_role;

  RETURN cnt;
END;
$$;
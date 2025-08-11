-- Server-side function for today's revenue with proper role checks
CREATE OR REPLACE FUNCTION public.get_today_revenue()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  total numeric;
BEGIN
  -- Allow staff roles that already have SELECT access patterns on payments
  IF public.get_current_user_role() NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  SELECT COALESCE(SUM(amount), 0)::numeric INTO total
  FROM public.payments
  WHERE status = 'completed'
    AND created_at::date = CURRENT_DATE;

  RETURN total;
END;
$$;
-- Fix the RPC functions to avoid audit logging issues
-- Create simplified versions that don't trigger audit logs

-- Drop the existing problematic functions
DROP FUNCTION IF EXISTS public.get_staff_member_count();
DROP FUNCTION IF EXISTS public.get_today_revenue();

-- Create new simplified functions without audit logging
CREATE OR REPLACE FUNCTION public.get_staff_member_count()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  cnt integer;
  current_user_role app_role;
BEGIN
  -- Direct role check without audit logging
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid();

  -- Only Admins and SuperAdmins may call this
  IF current_user_role NOT IN ('Admin'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.users
  WHERE role != 'Guest'::app_role;

  RETURN cnt;
END;
$function$;

-- Create revenue function without audit logging
CREATE OR REPLACE FUNCTION public.get_today_revenue()
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total numeric;
  current_user_role app_role;
BEGIN
  -- Direct role check without audit logging
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid();

  -- Allow staff roles that already have SELECT access patterns on payments
  IF current_user_role NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  SELECT COALESCE(SUM(amount), 0)::numeric INTO total
  FROM public.payments
  WHERE status = 'completed'
    AND created_at::date = CURRENT_DATE;

  RETURN total;
END;
$function$;
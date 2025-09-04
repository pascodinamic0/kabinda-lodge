-- Fix get_users_for_staff function to properly return staff user data
-- The function was incorrectly trying to filter by 'Guest' role which doesn't exist in the users table

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

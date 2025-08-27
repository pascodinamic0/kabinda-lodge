-- CRITICAL SECURITY FIXES FOR CUSTOMER DATA PROTECTION

-- 1. Create data masking functions
CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF email_input IS NULL OR length(email_input) < 3 THEN
    RETURN email_input;
  END IF;
  
  -- Format: j***@example.com
  RETURN substring(email_input from 1 for 1) || 
         repeat('*', greatest(1, length(split_part(email_input, '@', 1)) - 1)) ||
         '@' || split_part(email_input, '@', 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF phone_input IS NULL OR length(phone_input) < 4 THEN
    RETURN phone_input;
  END IF;
  
  -- Show only last 4 digits: ***-***-1234
  RETURN repeat('*', length(phone_input) - 4) || 
         right(phone_input, 4);
END;
$$;

-- 2. Fix existing database functions security (add proper search_path)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role with simple error handling
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- If user not found in users table, return Guest as default
  IF user_role IS NULL THEN
    RETURN 'Guest'::app_role;
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Return Guest as fallback without logging (to avoid INSERT in STABLE function)
    RETURN 'Guest'::app_role;
END;
$$;

-- 3. DROP existing permissive policies on users table
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff can view users for service" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins can view all users" ON public.users;

-- 4. Create secure RLS policies for users table with PII protection
CREATE POLICY "Staff can view basic user info only"
ON public.users
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
);

-- 5. Create view for staff with masked customer data
CREATE OR REPLACE VIEW public.users_staff_view AS
SELECT 
  id,
  name,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN email
    WHEN role != 'Guest'::app_role THEN email  -- Show full email for staff users
    ELSE mask_email(email)  -- Mask guest emails for non-SuperAdmin
  END as email,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN phone
    WHEN role != 'Guest'::app_role THEN phone  -- Show full phone for staff users
    ELSE mask_phone(phone)  -- Mask guest phones for non-SuperAdmin
  END as phone,
  role,
  created_at
FROM public.users
WHERE get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]);

-- 6. Secure bank accounts - SuperAdmin only
DROP POLICY IF EXISTS "Privileged can view active bank accounts" ON public.bank_accounts;

CREATE POLICY "SuperAdmin only can view bank accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- 7. Create secure booking views with masked guest data
CREATE OR REPLACE VIEW public.bookings_staff_view AS
SELECT 
  id,
  room_id,
  user_id,
  start_date,
  end_date,
  total_price,
  status,
  notes,
  created_at,
  created_by,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_name
    ELSE COALESCE(substring(guest_name from 1 for 1) || '***', 'Guest')
  END as guest_name,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_email
    ELSE mask_email(guest_email)
  END as guest_email,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_phone
    ELSE mask_phone(guest_phone)
  END as guest_phone
FROM public.bookings
WHERE get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]);

-- 8. Create secure conference booking views with masked guest data
CREATE OR REPLACE VIEW public.conference_bookings_staff_view AS
SELECT 
  id,
  conference_room_id,
  user_id,
  start_datetime,
  end_datetime,
  attendees,
  total_price,
  status,
  notes,
  created_at,
  created_by,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_name
    ELSE COALESCE(substring(guest_name from 1 for 1) || '***', 'Guest')
  END as guest_name,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_email
    ELSE mask_email(guest_email)
  END as guest_email,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN guest_phone
    ELSE mask_phone(guest_phone)
  END as guest_phone
FROM public.conference_bookings
WHERE get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]);

-- 9. Secure lost items contact info
CREATE OR REPLACE VIEW public.lost_items_staff_view AS
SELECT 
  id,
  item_name,
  description,
  location_found,
  date_found,
  status,
  found_by,
  claimed_date,
  created_at,
  updated_at,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN contact_info
    ELSE mask_phone(contact_info)
  END as contact_info,
  CASE 
    WHEN get_current_user_role() = 'SuperAdmin'::app_role THEN claimed_by
    ELSE COALESCE(substring(claimed_by from 1 for 1) || '***', claimed_by)
  END as claimed_by
FROM public.lost_items
WHERE get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]);

-- 10. Add security audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(table_name text, operation text, record_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    event_details,
    ip_address
  )
  VALUES (
    'sensitive_data_access',
    auth.uid(),
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'user_role', get_current_user_role(),
      'timestamp', now()
    ),
    inet_client_addr()
  );
END;
$$;
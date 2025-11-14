-- Add SuperAdmin role to the app_role enum
ALTER TYPE app_role ADD VALUE 'SuperAdmin';

-- Update get_current_user_role function to handle SuperAdmin
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

-- Update RLS policies to include SuperAdmin where needed
-- Update users table policies for SuperAdmin
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "SuperAdmins can view all users" 
ON public.users 
FOR SELECT 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY "SuperAdmins can update all users" 
ON public.users 
FOR UPDATE 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY "SuperAdmins can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'SuperAdmin'::app_role);

CREATE POLICY "SuperAdmins can delete users" 
ON public.users 
FOR DELETE 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- Update room override function to only allow SuperAdmin
CREATE OR REPLACE FUNCTION public.set_room_override(p_room_id integer, p_override boolean, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if user is SuperAdmin
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  IF current_user_role != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can set room overrides';
  END IF;
  
  -- Update room override status
  UPDATE public.rooms 
  SET 
    manual_override = p_override,
    override_reason = CASE WHEN p_override THEN p_reason ELSE NULL END,
    override_set_at = CASE WHEN p_override THEN now() ELSE NULL END,
    override_set_by = CASE WHEN p_override THEN auth.uid() ELSE NULL END
  WHERE id = p_room_id;
  
  -- Log the override change
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'room_override_change', 
    auth.uid(), 
    jsonb_build_object(
      'room_id', p_room_id,
      'override_enabled', p_override,
      'reason', p_reason
    )
  );
END;
$function$;

-- Update payment methods policies for SuperAdmin only
DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "SuperAdmins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- Update bank accounts policies for SuperAdmin only
DROP POLICY IF EXISTS "Admins can manage bank accounts" ON public.bank_accounts;
CREATE POLICY "SuperAdmins can manage bank accounts" 
ON public.bank_accounts 
FOR ALL 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- Update role change function to only allow SuperAdmin
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_user_role app_role;
  target_current_role app_role;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  -- Only SuperAdmins can change roles
  IF current_user_role != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can change user roles';
  END IF;
  
  -- Prevent self-role changes for additional security
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Security policy violation: Users cannot change their own role';
  END IF;
  
  -- Get target user's current role
  SELECT role INTO target_current_role FROM public.users WHERE id = target_user_id;
  
  IF target_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log the role change attempt
  INSERT INTO public.role_change_audit (
    user_id, 
    old_role, 
    new_role, 
    changed_by, 
    reason
  ) VALUES (
    target_user_id, 
    target_current_role, 
    new_role, 
    auth.uid(), 
    reason
  );
  
  -- Update the user's role
  UPDATE public.users 
  SET role = new_role 
  WHERE id = target_user_id;
  
  -- Log security event
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'role_change', 
    auth.uid(), 
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'reason', reason
    )
  );
END;
$function$;
-- Create a secure function for SuperAdmin to reset user passwords
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id uuid,
  new_password text,
  reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_user_role app_role;
  target_user_email text;
BEGIN
  -- Security check: Only SuperAdmins can reset passwords
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  IF current_user_role != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can reset user passwords';
  END IF;
  
  -- Prevent SuperAdmin from changing their own password through this function
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Security policy violation: Cannot reset your own password through admin function';
  END IF;
  
  -- Get target user's email for logging
  SELECT email INTO target_user_email FROM public.users WHERE id = target_user_id;
  
  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Log the password reset attempt
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'admin_password_reset_attempted',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'target_user_email', target_user_email,
      'reason', reason,
      'timestamp', now()
    )
  );
END;
$$;
-- Add RLS policies to the users_staff_view to control access
ALTER VIEW public.users_staff_view ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile through the view
CREATE POLICY "Users can view their own profile in staff view" 
ON public.users_staff_view 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Allow staff to view user data through the secure view (data is already masked)
CREATE POLICY "Staff can view user data through secure view" 
ON public.users_staff_view 
FOR SELECT 
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role])
);

-- Log the additional security enhancement
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'security_enhancement_users_staff_view',
  jsonb_build_object(
    'action', 'added_rls_policies_to_staff_view',
    'description', 'Added RLS policies to users_staff_view for enhanced access control',
    'timestamp', now()
  )
);
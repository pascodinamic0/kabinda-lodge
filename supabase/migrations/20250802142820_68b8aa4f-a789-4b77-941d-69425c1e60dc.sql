-- Fix SuperAdmin user role and clean up duplicates for ekabilam@gmail.com

-- Update the real user (from Supabase Auth) to have SuperAdmin role
UPDATE public.users 
SET 
  role = 'SuperAdmin'::app_role,
  name = 'Super Administrator'
WHERE id = 'f473efa8-de21-4368-8f2f-cc386dee4f28'::uuid
  AND email = 'ekabilam@gmail.com';

-- Remove the placeholder user record
DELETE FROM public.users 
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  AND email = 'ekabilam@gmail.com';

-- Log the fix in security audit log
INSERT INTO public.security_audit_log (event_type, event_details)
VALUES (
  'superadmin_role_fix', 
  jsonb_build_object(
    'action', 'fixed_duplicate_superadmin_records',
    'email', 'ekabilam@gmail.com',
    'real_user_id', 'f473efa8-de21-4368-8f2f-cc386dee4f28',
    'removed_placeholder_id', '00000000-0000-0000-0000-000000000001',
    'timestamp', now()
  )
);
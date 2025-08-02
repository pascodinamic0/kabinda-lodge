-- Create Super Admin user record
-- Note: The auth user must be created separately through Supabase Auth API or dashboard

-- Insert Super Admin user into users table
-- This will be linked when the auth user is created with the same ID
INSERT INTO public.users (id, name, email, role, phone)
VALUES (
  -- Using a predefined UUID that we'll use when creating the auth user
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Super Administrator',
  'ekabilam@gmail.com',
  'SuperAdmin'::app_role,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  role = 'SuperAdmin'::app_role,
  name = 'Super Administrator',
  email = 'ekabilam@gmail.com';
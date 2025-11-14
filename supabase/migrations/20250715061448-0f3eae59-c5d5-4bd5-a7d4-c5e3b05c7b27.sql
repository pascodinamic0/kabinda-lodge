-- Remove and recreate the users table with proper structure
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table with correct enum type
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role app_role NOT NULL DEFAULT 'Receptionist'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Admins can update all users" ON public.users
FOR UPDATE USING (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Admins can insert users" ON public.users
FOR INSERT WITH CHECK (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Admins can delete users" ON public.users
FOR DELETE USING (get_current_user_role() = 'Admin'::app_role);

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'role' = 'Admin' THEN 'Admin'::app_role
      WHEN NEW.raw_user_meta_data ->> 'role' = 'RestaurantLead' THEN 'RestaurantLead'::app_role
      ELSE 'Receptionist'::app_role
    END
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
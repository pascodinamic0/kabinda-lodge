-- Create the app_role enum type
CREATE TYPE public.app_role AS ENUM ('Admin', 'Receptionist', 'RestaurantLead');

-- Update the users table to use the enum type
ALTER TABLE public.users ALTER COLUMN role TYPE app_role USING role::app_role;

-- Recreate the trigger function with proper enum handling
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
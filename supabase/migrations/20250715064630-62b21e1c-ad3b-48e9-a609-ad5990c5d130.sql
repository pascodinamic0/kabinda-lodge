-- Drop and recreate the trigger function to fix the RLS issue
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a simpler trigger function that bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert directly without worrying about RLS since this runs as SECURITY DEFINER
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
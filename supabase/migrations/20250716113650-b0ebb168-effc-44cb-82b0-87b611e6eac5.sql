-- Add 'Guest' role to the existing app_role enum
ALTER TYPE app_role ADD VALUE 'Guest';

-- Update the handle_new_user function to support Guest role and set it as default for regular signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public', 'pg_temp'
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
      WHEN NEW.raw_user_meta_data ->> 'role' = 'Receptionist' THEN 'Receptionist'::app_role
      ELSE 'Guest'::app_role  -- Default role for client signups
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

-- Update RLS policies to allow guests to view their own bookings
CREATE POLICY "Guests can view their own bookings" ON public.bookings
FOR SELECT
USING (user_id = auth.uid() AND (
  SELECT role FROM public.users WHERE id = auth.uid()
) = 'Guest'::app_role);

-- Allow guests to create their own bookings
CREATE POLICY "Guests can create bookings" ON public.bookings
FOR INSERT
WITH CHECK (user_id = auth.uid() AND (
  SELECT role FROM public.users WHERE id = auth.uid()
) = 'Guest'::app_role);
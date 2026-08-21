-- Harden handle_new_user so staff/guest signup cannot fail with
-- "Database error saving new user" due to null/empty metadata or invalid role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_role text;
  v_phone text;
  v_app_role public.app_role;
BEGIN
  v_name := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'name', '')), '');
  IF v_name IS NULL THEN
    v_name := SPLIT_PART(COALESCE(new.email, 'user'), '@', 1);
  END IF;

  v_role := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'role', '')), '');
  IF v_role IS NULL OR v_role NOT IN ('Admin', 'Receptionist', 'RestaurantLead', 'Guest', 'SuperAdmin') THEN
    v_role := 'Guest';
  END IF;
  v_app_role := v_role::public.app_role;

  -- Prefer metadata phone; fall back to auth.users.phone; store NULL if empty
  v_phone := NULLIF(TRIM(COALESCE(
    new.raw_user_meta_data->>'phone',
    new.phone,
    ''
  )), '');

  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    v_name,
    v_app_role,
    v_phone
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = EXCLUDED.role,
    phone = COALESCE(EXCLUDED.phone, public.users.phone);

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but still attempt a minimal insert so auth signup is not blocked
    RAISE WARNING 'handle_new_user failed for %: %', new.id, SQLERRM;

    INSERT INTO public.users (id, email, name, role, phone)
    VALUES (
      new.id,
      COALESCE(new.email, ''),
      COALESCE(v_name, SPLIT_PART(COALESCE(new.email, 'user'), '@', 1)),
      'Guest'::public.app_role,
      NULL
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

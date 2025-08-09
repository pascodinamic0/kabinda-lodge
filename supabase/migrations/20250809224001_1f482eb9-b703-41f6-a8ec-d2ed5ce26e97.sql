-- 1) Add guest fields and created_by to bookings and conference_bookings
-- 2) Add validation + auto-created_by triggers
-- 3) Backfill created_by for staff-created records where user_id belongs to staff

-- Bookings: add columns if not exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Optional FK to public.users (not auth.users) for created_by
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_created_by_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Conference bookings: add columns if not exist
ALTER TABLE public.conference_bookings
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conference_bookings_created_by_fkey'
  ) THEN
    ALTER TABLE public.conference_bookings
      ADD CONSTRAINT conference_bookings_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Validation function for guest contact fields (reuses existing validate_email/validate_phone)
CREATE OR REPLACE FUNCTION public.validate_guest_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.guest_email IS NOT NULL AND length(trim(NEW.guest_email)) > 0 THEN
    IF NOT public.validate_email(NEW.guest_email) THEN
      RAISE EXCEPTION 'Invalid guest email format';
    END IF;
  END IF;

  IF NEW.guest_phone IS NOT NULL AND length(trim(NEW.guest_phone)) > 0 THEN
    IF NOT public.validate_phone(NEW.guest_phone) THEN
      RAISE EXCEPTION 'Invalid guest phone format';
    END IF;
  END IF;

  IF NEW.guest_name IS NOT NULL THEN
    NEW.guest_name := trim(NEW.guest_name);
  END IF;

  RETURN NEW;
END;
$$;

-- Generic function to set created_by on insert if null
CREATE OR REPLACE FUNCTION public.set_created_by_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers to bookings
DROP TRIGGER IF EXISTS trg_bookings_validate_guest ON public.bookings;
CREATE TRIGGER trg_bookings_validate_guest
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_guest_contact_fields();

DROP TRIGGER IF EXISTS trg_bookings_set_created_by ON public.bookings;
CREATE TRIGGER trg_bookings_set_created_by
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_created_by_default();

-- Attach triggers to conference_bookings
DROP TRIGGER IF EXISTS trg_conf_bookings_validate_guest ON public.conference_bookings;
CREATE TRIGGER trg_conf_bookings_validate_guest
BEFORE INSERT OR UPDATE ON public.conference_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_guest_contact_fields();

DROP TRIGGER IF EXISTS trg_conf_bookings_set_created_by ON public.conference_bookings;
CREATE TRIGGER trg_conf_bookings_set_created_by
BEFORE INSERT ON public.conference_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_created_by_default();

-- Backfill created_by where user_id is staff (Admin/Receptionist/RestaurantLead/SuperAdmin)
-- This preserves user_id as-is and only sets created_by for clarity.
UPDATE public.bookings b
SET created_by = b.user_id
WHERE created_by IS NULL AND EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = b.user_id AND u.role IN ('Admin'::app_role, 'Receptionist'::app_role, 'RestaurantLead'::app_role, 'SuperAdmin'::app_role)
);

UPDATE public.conference_bookings cb
SET created_by = cb.user_id
WHERE created_by IS NULL AND EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = cb.user_id AND u.role IN ('Admin'::app_role, 'Receptionist'::app_role, 'RestaurantLead'::app_role, 'SuperAdmin'::app_role)
);

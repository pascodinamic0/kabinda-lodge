-- 1) Add conference_booking_id to payments and index/foreign key
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS conference_booking_id integer;

CREATE INDEX IF NOT EXISTS idx_payments_conference_booking_id 
  ON public.payments (conference_booking_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_conference_booking_id_fkey'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_conference_booking_id_fkey
      FOREIGN KEY (conference_booking_id)
      REFERENCES public.conference_bookings(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 2) RLS policies for guest access via conference bookings
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Guests can create payments for their conference bookings'
  ) THEN
    CREATE POLICY "Guests can create payments for their conference bookings"
    ON public.payments
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.conference_bookings cb
        WHERE cb.id = conference_booking_id AND cb.user_id = auth.uid()
      )
    );
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Guests can view their own conference payments'
  ) THEN
    CREATE POLICY "Guests can view their own conference payments"
    ON public.payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.conference_bookings cb
        WHERE cb.id = conference_booking_id AND cb.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- 3) Add attendees to conference_bookings
ALTER TABLE public.conference_bookings
  ADD COLUMN IF NOT EXISTS attendees integer NOT NULL DEFAULT 1;

-- 4) Capacity validation trigger for conference bookings
CREATE OR REPLACE FUNCTION public.validate_conference_booking_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF NEW.attendees IS NULL OR NEW.attendees < 1 THEN
    RAISE EXCEPTION 'Attendees must be at least 1';
  END IF;

  -- Ensure attendees do not exceed room capacity
  PERFORM 1
  FROM public.conference_rooms r
  WHERE r.id = NEW.conference_room_id AND r.capacity >= NEW.attendees;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendees (%) exceed room capacity', NEW.attendees;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_conference_booking_capacity ON public.conference_bookings;
CREATE TRIGGER trg_validate_conference_booking_capacity
BEFORE INSERT OR UPDATE ON public.conference_bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_conference_booking_capacity();
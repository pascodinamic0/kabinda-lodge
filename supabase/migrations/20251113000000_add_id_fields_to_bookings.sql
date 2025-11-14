-- Add ID fields to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_id_type text,
  ADD COLUMN IF NOT EXISTS guest_id_number text;

-- Add check constraint for id_type values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_guest_id_type_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_guest_id_type_check
      CHECK (guest_id_type IS NULL OR guest_id_type IN ('citizen_id', 'passport', 'driving_license'));
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.guest_id_type IS 'Type of identification document: citizen_id, passport, or driving_license';
COMMENT ON COLUMN public.bookings.guest_id_number IS 'Guest identification document number';


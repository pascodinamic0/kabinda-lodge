-- Update the bookings status check constraint to include all necessary status values
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the updated constraint with all required status values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('booked', 'pending_payment', 'confirmed', 'checked-in', 'checked-out', 'cancelled'));

-- Also update the default status to be more appropriate for the booking flow
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending_payment';
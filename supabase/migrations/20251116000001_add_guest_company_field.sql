-- Add guest_company field to bookings and conference_bookings tables
-- This field stores the company/organization name for business travelers

-- Add company field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_company TEXT;

-- Add company field to conference_bookings table
ALTER TABLE public.conference_bookings 
ADD COLUMN IF NOT EXISTS guest_company TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.guest_company IS 'Company or organization name of the guest (for business bookings)';
COMMENT ON COLUMN public.conference_bookings.guest_company IS 'Company or organization name of the guest (for business bookings)';


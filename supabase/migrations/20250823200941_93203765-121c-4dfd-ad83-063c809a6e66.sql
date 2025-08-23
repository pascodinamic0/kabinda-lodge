-- Rename hourly_rate column to daily_rate in conference_rooms table
ALTER TABLE public.conference_rooms 
RENAME COLUMN hourly_rate TO daily_rate;

-- Update any existing data or constraints if needed
COMMENT ON COLUMN public.conference_rooms.daily_rate IS 'Price per day for conference room booking';
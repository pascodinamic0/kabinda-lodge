-- Migration: Add conference room event-specific fields
-- Created: 2024-11-17
-- Purpose: Add fields for event type, buffet options, and enhanced conference booking tracking

-- Add new columns to conference_bookings table
ALTER TABLE public.conference_bookings 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS event_duration_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS buffet_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS buffet_package VARCHAR(200),
ADD COLUMN IF NOT EXISTS guest_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.conference_bookings.event_type IS 'Type of event (e.g., Wedding, Corporate Meeting, Workshop, Seminar, Training, Conference)';
COMMENT ON COLUMN public.conference_bookings.event_duration_hours IS 'Duration of event in hours (can be fractional, e.g., 2.5 hours)';
COMMENT ON COLUMN public.conference_bookings.buffet_required IS 'Whether client requires buffet service';
COMMENT ON COLUMN public.conference_bookings.buffet_package IS 'Selected buffet menu package if buffet is required';
COMMENT ON COLUMN public.conference_bookings.guest_company IS 'Company/Organization name for corporate events';
COMMENT ON COLUMN public.conference_bookings.special_requirements IS 'Special requirements like equipment, decorations, dietary restrictions, etc.';

-- Create index for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_conference_bookings_event_type ON public.conference_bookings(event_type);
CREATE INDEX IF NOT EXISTS idx_conference_bookings_buffet_required ON public.conference_bookings(buffet_required);

-- Update RLS policies if needed (maintain existing security)
-- No changes to RLS needed - new fields follow same security model





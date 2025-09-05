-- Manual setup for individual room amenities functionality
-- Run this SQL in your Supabase SQL Editor to enable room amenities

-- The room_amenities table should already exist from a previous migration
-- But let's ensure it exists and has the right structure

-- Create room_amenities junction table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.room_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, amenity_id)
);

-- Enable RLS (if not already enabled)
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;

-- Create policies (if they don't exist)
DROP POLICY IF EXISTS "Everyone can view room amenities" ON public.room_amenities;
CREATE POLICY "Everyone can view room amenities" ON public.room_amenities
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Receptionists can manage room amenities" ON public.room_amenities;
CREATE POLICY "Receptionists can manage room amenities" ON public.room_amenities
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Ensure amenities table exists with some default data
INSERT INTO public.amenities (name, icon_name, category) VALUES
('Air Conditioning', 'wind', 'comfort'),
('Free WiFi', 'wifi', 'technology'),
('Smart TV', 'tv', 'technology'),
('Coffee Machine', 'coffee', 'dining'),
('Private Bathroom', 'bath', 'bathroom'),
('Room Service', 'bell', 'service'),
('Daily Housekeeping', 'sparkles', 'service'),
('Mini Bar', 'wine', 'dining'),
('City View', 'building', 'view'),
('Work Desk', 'laptop', 'business'),
('King Size Bed', 'bed', 'comfort'),
('Safe', 'lock', 'security'),
('Balcony', 'sun', 'view'),
('Hair Dryer', 'zap', 'bathroom'),
('Iron & Board', 'shirt', 'service'),
('Telephone', 'phone', 'technology')
ON CONFLICT (name) DO NOTHING;


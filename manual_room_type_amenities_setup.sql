-- Manual setup for room type amenities functionality
-- Run this SQL in your Supabase SQL Editor to enable the full amenities feature

-- Create room_type_amenities junction table
CREATE TABLE IF NOT EXISTS public.room_type_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_type_id, amenity_id)
);

-- Enable RLS
ALTER TABLE public.room_type_amenities ENABLE ROW LEVEL SECURITY;

-- Policies for room_type_amenities
CREATE POLICY "Everyone can view room type amenities" ON public.room_type_amenities
FOR SELECT USING (true);

CREATE POLICY "Admins can manage room type amenities" ON public.room_type_amenities
FOR ALL USING (get_current_user_role() = 'Admin'::app_role);

-- Add some default amenities to existing room types
-- Standard room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Standard' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Private Bathroom', 'Daily Housekeeping')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Deluxe room type amenities  
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Deluxe' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Smart TV', 'Coffee Machine', 'Private Bathroom', 'Daily Housekeeping', 'Mini Bar', 'Work Desk')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Suite room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Suite' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Smart TV', 'Coffee Machine', 'Private Bathroom', 'Room Service', 'Daily Housekeeping', 'Mini Bar', 'City View', 'Work Desk', 'King Size Bed', 'Safe', 'Balcony')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Presidential room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Presidential' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Smart TV', 'Coffee Machine', 'Private Bathroom', 'Room Service', 'Daily Housekeeping', 'Mini Bar', 'City View', 'Work Desk', 'King Size Bed', 'Safe', 'Balcony', 'Hair Dryer', 'Iron & Board', 'Telephone')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Single room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Single' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Private Bathroom', 'Daily Housekeeping', 'Work Desk')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Double room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Double' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Smart TV', 'Private Bathroom', 'Daily Housekeeping', 'Coffee Machine')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;

-- Twin room type amenities
INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM public.room_types rt, public.amenities a
WHERE rt.name = 'Twin' 
AND a.name IN ('Air Conditioning', 'Free WiFi', 'Smart TV', 'Private Bathroom', 'Daily Housekeeping', 'Coffee Machine', 'Work Desk')
ON CONFLICT (room_type_id, amenity_id) DO NOTHING;






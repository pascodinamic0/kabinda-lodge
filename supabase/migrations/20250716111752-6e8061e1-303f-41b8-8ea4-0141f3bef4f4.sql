-- Create amenities table
CREATE TABLE public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_name TEXT, -- lucide icon name
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create room_amenities junction table
CREATE TABLE public.room_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, amenity_id)
);

-- Enable RLS
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;

-- Policies for amenities
CREATE POLICY "Everyone can view amenities" ON public.amenities
FOR SELECT USING (true);

CREATE POLICY "Receptionists can manage amenities" ON public.amenities
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Policies for room_amenities
CREATE POLICY "Everyone can view room amenities" ON public.room_amenities
FOR SELECT USING (true);

CREATE POLICY "Receptionists can manage room amenities" ON public.room_amenities
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Insert default amenities
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
('Telephone', 'phone', 'technology'),
('Minibar Fridge', 'refrigerator', 'dining'),
('Slippers', 'footprints', 'comfort'),
('Bathrobe', 'shirt', 'comfort'),
('Premium Toiletries', 'package', 'bathroom');
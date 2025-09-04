-- Populate default amenities for the system
-- Run this in your Supabase SQL Editor

-- Insert default amenities (only if they don't exist)
INSERT INTO public.amenities (name, icon_name, category) VALUES
-- Technology
('Free WiFi', 'wifi', 'technology'),
('Smart TV', 'tv', 'technology'),
('Work Desk', 'laptop', 'technology'),
('Telephone', 'phone', 'technology'),
('Power Outlets', 'zap', 'technology'),

-- Comfort
('Air Conditioning', 'wind', 'comfort'),
('King Size Bed', 'bed', 'comfort'),
('Private Bathroom', 'bath', 'comfort'),
('Balcony', 'sun', 'comfort'),
('City View', 'building', 'comfort'),
('Hair Dryer', 'zap', 'comfort'),

-- Dining
('Coffee Machine', 'coffee', 'dining'),
('Mini Bar', 'wine', 'dining'),
('Room Service', 'bell', 'dining'),

-- Service
('Daily Housekeeping', 'sparkles', 'service'),
('Iron & Board', 'shirt', 'service'),
('Safe', 'lock', 'security'),
('24/7 Front Desk', 'users', 'service'),

-- General
('Non-Smoking', 'shield', 'general'),
('Pet Friendly', 'heart', 'general'),
('Wheelchair Accessible', 'wheelchair', 'accessibility')
ON CONFLICT (name) DO NOTHING;

-- Check what amenities we have
SELECT * FROM amenities ORDER BY category, name;

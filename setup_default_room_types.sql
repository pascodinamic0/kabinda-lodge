-- Setup default room types if none exist
-- Run this in your Supabase SQL Editor

-- Insert default room types (only if they don't exist)
INSERT INTO public.room_types (name, description) VALUES
('Standard Single', 'Comfortable single room with basic amenities'),
('Standard Double', 'Spacious double room perfect for couples'),
('Deluxe Room', 'Premium room with enhanced comfort and amenities'),
('Family Suite', 'Large suite ideal for families with multiple beds'),
('Executive Suite', 'Luxury suite with premium amenities and services'),
('Business Room', 'Professional room designed for business travelers')
ON CONFLICT (name) DO NOTHING;

-- Check what room types we have
SELECT * FROM room_types ORDER BY name;


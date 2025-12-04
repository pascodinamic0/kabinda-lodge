-- Create default hotel for Kabinda Lodge
-- Run this in Supabase SQL Editor if the API route fails

-- Insert default hotel (if it doesn't exist)
INSERT INTO hotels (name)
SELECT 'Kabinda Lodge'
WHERE NOT EXISTS (
  SELECT 1 FROM hotels WHERE name = 'Kabinda Lodge'
)
RETURNING id;

-- If you need to link your user to the hotel, run this (replace YOUR_USER_ID with your actual user ID):
-- INSERT INTO hotel_users (hotel_id, user_id, email, name, role)
-- SELECT h.id, 'YOUR_USER_ID', 'your-email@example.com', 'Your Name', 'admin'
-- FROM hotels h
-- WHERE h.name = 'Kabinda Lodge'
-- ON CONFLICT (user_id, hotel_id) DO NOTHING;





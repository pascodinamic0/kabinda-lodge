-- Update RLS policies to allow hotel creation
-- Run this in Supabase SQL Editor to fix RLS issues

-- Drop existing policy
DROP POLICY IF EXISTS "Users can read their hotel" ON hotels;

-- Allow authenticated users to read all hotels (for single-hotel systems)
CREATE POLICY "Authenticated users can read hotels" ON hotels
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to insert hotels (for initial setup)
-- You can restrict this later if needed
CREATE POLICY "Authenticated users can create hotels" ON hotels
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow users to read hotels they belong to (more restrictive option)
-- Uncomment this if you want the more restrictive policy instead:
-- CREATE POLICY "Users can read their hotel" ON hotels
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM hotel_users 
--       WHERE hotel_users.hotel_id = hotels.id 
--       AND hotel_users.user_id = auth.uid()
--     )
--   );





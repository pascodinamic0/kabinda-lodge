-- Quick fix: Allow authenticated users to read hotels
-- Run this in Supabase SQL Editor to fix the loading issue

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read their hotel" ON hotels;

-- Create a more permissive policy for single-hotel systems
CREATE POLICY "Authenticated users can read hotels" ON hotels
  FOR SELECT 
  TO authenticated
  USING (true);

-- This allows any authenticated user to read hotels
-- For a single-hotel system, this is usually fine
-- You can make it more restrictive later if needed





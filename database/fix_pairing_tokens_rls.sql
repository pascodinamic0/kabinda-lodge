-- Fix RLS policy for pairing_tokens table
-- Allow authenticated users to create pairing tokens (for single-hotel systems)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can create pairing tokens" ON pairing_tokens;

-- Create a more permissive policy for single-hotel systems
CREATE POLICY "Authenticated users can create pairing tokens" ON pairing_tokens
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- This allows any authenticated user to create pairing tokens
-- For a single-hotel system, this is usually fine
-- You can make it more restrictive later if needed





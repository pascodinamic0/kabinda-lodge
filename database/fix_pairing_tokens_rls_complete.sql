-- Complete fix for pairing_tokens RLS policies
-- This ensures all old policies are removed and a new permissive one is created

-- Drop ALL existing policies on pairing_tokens
DROP POLICY IF EXISTS "Admins can create pairing tokens" ON pairing_tokens;
DROP POLICY IF EXISTS "Authenticated users can create pairing tokens" ON pairing_tokens;
DROP POLICY IF EXISTS "Anyone can read pairing tokens by token value" ON pairing_tokens;

-- Recreate the read policy (this one is fine)
CREATE POLICY "Anyone can read pairing tokens by token value" ON pairing_tokens
  FOR SELECT USING (true);

-- Create a new permissive insert policy for authenticated users
CREATE POLICY "Authenticated users can create pairing tokens" ON pairing_tokens
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Verify: You can check policies with:
-- SELECT * FROM pg_policies WHERE tablename = 'pairing_tokens';





-- Fix RLS policy for agents table
-- Allow authenticated users to read agents (for single-hotel systems)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read agents for their hotel" ON agents;

-- Create a more permissive policy for single-hotel systems
CREATE POLICY "Authenticated users can read agents" ON agents
  FOR SELECT 
  TO authenticated
  USING (true);

-- This allows any authenticated user to read agents
-- For a single-hotel system, this is usually fine
-- You can make it more restrictive later if needed





-- Verify RLS policies on pairing_tokens table
-- Run this to see what policies currently exist

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pairing_tokens'
ORDER BY policyname;

-- Also check if RLS is enabled on the table
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'pairing_tokens';





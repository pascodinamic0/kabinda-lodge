-- Add RLS policy to allow anonymous users to view feedback for homepage
CREATE POLICY "Anonymous users can view feedback for homepage" 
ON public.feedback 
FOR SELECT 
USING (true);

-- Add RLS policy to allow anonymous users to view user names for feedback display
CREATE POLICY "Anonymous users can view user names for feedback" 
ON public.users 
FOR SELECT 
USING (true);
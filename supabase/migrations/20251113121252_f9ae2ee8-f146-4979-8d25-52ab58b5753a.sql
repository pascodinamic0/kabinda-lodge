-- Drop existing restrictive policies on promotions
DROP POLICY IF EXISTS "Everyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;

-- Create comprehensive RLS policies for promotions
-- Allow everyone (including anonymous users) to view active promotions
CREATE POLICY "Public can view active promotions"
ON public.promotions
FOR SELECT
TO public
USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- Allow authenticated users to view all active promotions (including future ones)
CREATE POLICY "Authenticated users can view all active promotions"
ON public.promotions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow Admins and SuperAdmins to manage all promotions
CREATE POLICY "Admins can manage all promotions"
ON public.promotions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'SuperAdmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'SuperAdmin')
  )
);
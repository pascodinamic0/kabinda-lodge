-- Update RLS policy to allow SuperAdmin access to promotions
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;

CREATE POLICY "Admins can manage promotions" 
ON public.promotions 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]));
-- Drop existing policy if it exists (to be safe/clean)
DROP POLICY IF EXISTS "Allow admin write access" ON public.buffet_options;
DROP POLICY IF EXISTS "Allow public read access" ON public.buffet_options;

-- Re-create policies with explicit WITH CHECK for inserts/updates
CREATE POLICY "Allow public read access"
  ON public.buffet_options FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access"
  ON public.buffet_options FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default buffet options
INSERT INTO public.buffet_options (name, description, price, is_available)
VALUES 
  ('Standard Continental', 'Coffee, Tea, Pastries', 15.00, true),
  ('Business Lunch', 'Salads, Main Course, Dessert', 35.00, true),
  ('Premium Package', 'Full Breakfast/Lunch with Drinks', 55.00, true),
  ('Cocktail Reception', 'Appetizers, Drinks, Dessert', 45.00, true),
  ('Custom Menu', 'To Be Discussed', 0.00, true);




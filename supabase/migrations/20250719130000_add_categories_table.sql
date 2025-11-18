-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage categories" ON public.categories
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

-- Insert some default categories
INSERT INTO public.categories (name, description, display_order) VALUES
  ('Appetizers', 'Starters and small plates', 1),
  ('Main Course', 'Main dishes and entrees', 2),
  ('Desserts', 'Sweet treats and desserts', 3),
  ('Beverages', 'Drinks and beverages', 4),
  ('Drinks', 'Alcoholic and non-alcoholic drinks', 5)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();













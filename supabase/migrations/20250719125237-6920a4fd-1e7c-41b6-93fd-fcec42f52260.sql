-- Add image support for menu items
ALTER TABLE public.menu_items ADD COLUMN image_url text;

-- Create menu_images table for multiple images per menu item
CREATE TABLE public.menu_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id INTEGER NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on menu_images
ALTER TABLE public.menu_images ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_images
CREATE POLICY "Everyone can view menu images" ON public.menu_images
FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage menu images" ON public.menu_images
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

-- Create conference room management tables if needed (they already exist)
-- Add storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create storage policies for menu-images bucket
CREATE POLICY "Menu images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant staff can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'menu-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

CREATE POLICY "Restaurant staff can update menu images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'menu-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

CREATE POLICY "Restaurant staff can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'menu-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

-- Create storage bucket for conference room images (already exists, add missing policies if needed)
INSERT INTO storage.buckets (id, name, public) VALUES ('conference-images', 'conference-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for conference-images bucket
CREATE POLICY "Conference images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'conference-images');

CREATE POLICY "Staff can upload conference images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'conference-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can update conference images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'conference-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can delete conference images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'conference-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));
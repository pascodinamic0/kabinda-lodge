-- Create restaurant_images table for restaurant galleries
CREATE TABLE public.restaurant_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_images ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant images
CREATE POLICY "Everyone can view restaurant images" 
ON public.restaurant_images 
FOR SELECT 
USING (true);

CREATE POLICY "Restaurant staff can manage restaurant images" 
ON public.restaurant_images 
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

-- Add some sample restaurant images
INSERT INTO public.restaurant_images (restaurant_id, image_url, alt_text, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'Elegant dining room interior', 1),
(1, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'Restaurant kitchen in action', 2),
(1, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', 'Signature dish presentation', 3),
(2, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'Modern restaurant exterior', 1),
(2, 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800', 'Contemporary dining space', 2),
(3, 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800', 'Cozy restaurant atmosphere', 1),
(3, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800', 'Traditional cuisine setting', 2);
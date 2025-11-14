-- Create website_content table to store dynamic content
CREATE TABLE public.website_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL UNIQUE,
  content jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read website content (for public pages)
CREATE POLICY "Everyone can view website content" 
ON public.website_content 
FOR SELECT 
USING (true);

-- Only admins can manage website content
CREATE POLICY "Admins can manage website content" 
ON public.website_content 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_content_updated_at
BEFORE UPDATE ON public.website_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.website_content (section, content) VALUES
('hero_image', '{"image_url": "/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png", "alt_text": "Beautiful location view of Kabinda Lodge", "title": "Beautiful Location", "description": "Stunning views await you"}'),
('about_us', '{"title": "About Kabinda Lodge", "subtitle": "Experience Excellence in Hospitality", "content": "Welcome to Kabinda Lodge, where comfort meets luxury in the heart of nature. Our establishment has been providing exceptional hospitality services for years, combining modern amenities with traditional warmth.", "mission": "To provide our guests with unforgettable experiences through exceptional service, comfortable accommodations, and memorable dining.", "vision": "To be the premier destination for travelers seeking quality, comfort, and authentic hospitality.", "values": ["Exceptional Service", "Guest Satisfaction", "Sustainability", "Community Engagement"], "image_url": "/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png", "alt_text": "Kabinda Lodge exterior view"}'),
('footer', '{"company_name": "Kabinda Lodge", "address": "123 Lodge Road, Kabinda City", "email": "info@kakindalodge.com", "phone": "+1 (555) 123-4567", "services": ["Room Service", "Restaurant", "Conference Facilities", "Event Planning", "Catering Services"]}'),
('amenities', '{"title": "Premium Amenities & Services", "subtitle": "Everything you need for a perfect stay", "amenities": [{"name": "Luxury Spa", "description": "Relax and rejuvenate", "icon": "Sparkles"}, {"name": "Fine Dining", "description": "Exquisite culinary experiences", "icon": "ChefHat"}, {"name": "Conference Rooms", "description": "Modern business facilities", "icon": "Users"}, {"name": "24/7 Concierge", "description": "Always here to help", "icon": "Clock"}, {"name": "Fitness Center", "description": "Stay active during your visit", "icon": "Dumbbell"}, {"name": "Free WiFi", "description": "High-speed internet access", "icon": "Wifi"}]}');
-- Extend website_content to support site branding and languages
-- First, create an enum for supported languages
CREATE TYPE public.language_code AS ENUM ('en', 'fr', 'es', 'pt', 'ar');

-- Add language support to website_content table
ALTER TABLE public.website_content 
ADD COLUMN language language_code DEFAULT 'en' NOT NULL;

-- Create unique constraint on section + language combination
ALTER TABLE public.website_content 
ADD CONSTRAINT unique_section_language UNIQUE (section, language);

-- Insert default site branding content sections
INSERT INTO public.website_content (section, language, content) VALUES 
('site_branding', 'en', '{
  "logo_url": "/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png",
  "logo_alt": "Kabinda Lodge Logo",
  "favicon_url": "/favicon.ico",
  "company_name": "Kabinda Lodge",
  "tagline": "Premium Hospitality"
}'),
('header_contact', 'en', '{
  "phone": "+1 (555) 123-4567",
  "email": "info@kabidalodge.com",
  "tagline_text": "Experience Luxury • Create Memories"
}'),
('site_settings', 'en', '{
  "auto_detect_language": true,
  "default_language": "en",
  "supported_languages": ["en", "fr"]
}')
ON CONFLICT (section, language) DO NOTHING;

-- Create language translations table for UI text
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language language_code NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key, language)
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create policies for translations
CREATE POLICY "Everyone can view translations" 
ON public.translations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage translations" 
ON public.translations 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

-- Insert basic UI translations
INSERT INTO public.translations (key, language, value) VALUES
-- English translations
('nav.home', 'en', 'Home'),
('nav.rooms', 'en', 'Rooms & Suites'),
('nav.about', 'en', 'About'),
('nav.dining', 'en', 'Dining'),
('nav.contact', 'en', 'Contact'),
('auth.staff_login', 'en', 'Staff Login'),
('auth.book_now', 'en', 'Book Now'),
('auth.sign_out', 'en', 'Sign Out'),
('auth.my_bookings', 'en', 'My Bookings'),
('common.dashboard', 'en', 'Dashboard'),

-- French translations
('nav.home', 'fr', 'Accueil'),
('nav.rooms', 'fr', 'Chambres & Suites'),
('nav.about', 'fr', 'À Propos'),
('nav.dining', 'fr', 'Restaurant'),
('nav.contact', 'fr', 'Contact'),
('auth.staff_login', 'fr', 'Connexion Personnel'),
('auth.book_now', 'fr', 'Réserver'),
('auth.sign_out', 'fr', 'Déconnexion'),
('auth.my_bookings', 'fr', 'Mes Réservations'),
('common.dashboard', 'fr', 'Tableau de Bord')

ON CONFLICT (key, language) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
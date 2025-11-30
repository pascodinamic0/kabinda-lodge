-- Google Business Profile Reviews Integration
-- This migration adds support for fetching and displaying Google Business Profile reviews

-- Create google_reviews_cache table to store cached reviews
CREATE TABLE IF NOT EXISTS public.google_reviews_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT NOT NULL UNIQUE, -- Unique Google review ID
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  time TIMESTAMP WITH TIME ZONE NOT NULL, -- Original review timestamp
  profile_photo_url TEXT,
  relative_time_description TEXT, -- e.g., "2 weeks ago"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on review_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_google_reviews_cache_review_id ON public.google_reviews_cache(review_id);

-- Create index on time for sorting
CREATE INDEX IF NOT EXISTS idx_google_reviews_cache_time ON public.google_reviews_cache(time DESC);

-- Enable RLS
ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_reviews_cache
-- Everyone can read reviews (public display)
CREATE POLICY "Everyone can view Google reviews cache" 
ON public.google_reviews_cache 
FOR SELECT 
USING (true);

-- Only admins can insert/update/delete reviews
CREATE POLICY "Admins can manage Google reviews cache" 
ON public.google_reviews_cache 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_google_reviews_cache_updated_at
BEFORE UPDATE ON public.google_reviews_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Google reviews configuration into website_content
INSERT INTO public.website_content (section, language, content) VALUES 
('google_reviews_config', 'en', '{
  "business_profile_url": "",
  "place_id": "",
  "api_key": "",
  "enabled": false,
  "refresh_interval": 24,
  "last_sync_time": null,
  "review_count": 0
}'::jsonb)
ON CONFLICT (section, language) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.google_reviews_cache TO anon, authenticated;
GRANT ALL ON public.google_reviews_cache TO authenticated;



-- Create google_reviews_cache table for storing Google Places API reviews
CREATE TABLE IF NOT EXISTS public.google_reviews_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id TEXT NOT NULL UNIQUE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    profile_photo_url TEXT,
    relative_time_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on review_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_reviews_cache_review_id ON public.google_reviews_cache(review_id);

-- Create index on time for sorting reviews
CREATE INDEX IF NOT EXISTS idx_google_reviews_cache_time ON public.google_reviews_cache(time DESC);

-- Enable Row Level Security
ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for website display)
CREATE POLICY "Allow public read access to google reviews cache" ON public.google_reviews_cache
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to manage reviews (for admin panel)
CREATE POLICY "Allow authenticated users to manage google reviews cache" ON public.google_reviews_cache
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_reviews_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_google_reviews_cache_updated_at
    BEFORE UPDATE ON public.google_reviews_cache
    FOR EACH ROW EXECUTE FUNCTION update_google_reviews_cache_updated_at();

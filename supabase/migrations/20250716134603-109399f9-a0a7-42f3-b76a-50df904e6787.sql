-- Create a bucket for general media uploads (logos, banners, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('media-uploads', 'media-uploads', true);

-- Create policies for media uploads bucket
CREATE POLICY "Media uploads are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media-uploads');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'media-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'media-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'media-uploads' AND auth.role() = 'authenticated');
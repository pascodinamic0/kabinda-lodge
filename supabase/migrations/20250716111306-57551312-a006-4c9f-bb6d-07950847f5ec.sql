-- Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public) VALUES ('room-images', 'room-images', true);

-- Create room_images table to track uploaded images
CREATE TABLE public.room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on room_images
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;

-- Create policies for room_images
CREATE POLICY "Everyone can view room images" ON public.room_images
FOR SELECT USING (true);

CREATE POLICY "Receptionists can manage room images" ON public.room_images
FOR ALL USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Create storage policies for room-images bucket
CREATE POLICY "Room images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'room-images');

CREATE POLICY "Receptionists can upload room images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'room-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Receptionists can update room images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'room-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Receptionists can delete room images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'room-images' AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));
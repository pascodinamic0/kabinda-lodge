-- Add missing promotion columns to conference_bookings
ALTER TABLE conference_bookings
  ADD COLUMN IF NOT EXISTS promotion_id integer REFERENCES promotions(id),
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric;

-- Create conference-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('conference-images', 'conference-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to conference-images bucket
CREATE POLICY "Public read access for conference images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'conference-images');

-- Allow authenticated users to upload conference images
CREATE POLICY "Authenticated users can upload conference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'conference-images');

-- Allow authenticated users to delete conference images
CREATE POLICY "Authenticated users can delete conference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'conference-images');

-- RLS policies for conference_rooms
ALTER TABLE conference_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conference rooms"
  ON conference_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage conference rooms"
  ON conference_rooms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for conference_room_images
ALTER TABLE conference_room_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conference room images"
  ON conference_room_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage conference room images"
  ON conference_room_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for conference_bookings
ALTER TABLE conference_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conference bookings"
  ON conference_bookings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage conference bookings"
  ON conference_bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

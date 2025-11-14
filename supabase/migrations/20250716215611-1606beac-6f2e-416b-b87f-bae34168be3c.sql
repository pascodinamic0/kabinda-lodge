-- Create room_types table
CREATE TABLE public.room_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view room types" 
ON public.room_types 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage room types" 
ON public.room_types 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

-- Insert default room types
INSERT INTO public.room_types (name, description) VALUES
('Standard', 'Basic room with essential amenities'),
('Deluxe', 'Enhanced room with additional comfort features'),
('Suite', 'Spacious room with separate living area'),
('Presidential', 'Luxury suite with premium amenities'),
('Single', 'Compact room designed for one guest'),
('Double', 'Room with double bed for two guests'),
('Twin', 'Room with two single beds');

-- Add trigger for updated_at
CREATE TRIGGER update_room_types_updated_at
BEFORE UPDATE ON public.room_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
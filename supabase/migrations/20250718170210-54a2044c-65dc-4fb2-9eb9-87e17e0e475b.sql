-- Create conference rooms table
CREATE TABLE public.conference_rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conference room images table
CREATE TABLE public.conference_room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_room_id INTEGER NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conference room bookings table
CREATE TABLE public.conference_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conference_room_id INTEGER NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conference_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_bookings ENABLE ROW LEVEL SECURITY;

-- Conference rooms policies
CREATE POLICY "Everyone can view conference rooms" 
ON public.conference_rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage conference rooms" 
ON public.conference_rooms 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Receptionists can update conference room status" 
ON public.conference_rooms 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Conference room images policies
CREATE POLICY "Everyone can view conference room images" 
ON public.conference_room_images 
FOR SELECT 
USING (true);

CREATE POLICY "Receptionists can manage conference room images" 
ON public.conference_room_images 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Conference bookings policies
CREATE POLICY "Guests can create conference bookings" 
ON public.conference_bookings 
FOR INSERT 
WITH CHECK ((user_id = auth.uid()) AND (( SELECT users.role FROM users WHERE (users.id = auth.uid())) = 'Guest'::app_role));

CREATE POLICY "Guests can view their own conference bookings" 
ON public.conference_bookings 
FOR SELECT 
USING ((user_id = auth.uid()) AND (( SELECT users.role FROM users WHERE (users.id = auth.uid())) = 'Guest'::app_role));

CREATE POLICY "Staff can manage conference bookings" 
ON public.conference_bookings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Users can view their own conference bookings" 
ON public.conference_bookings 
FOR SELECT 
USING (user_id = auth.uid());

-- Create update trigger for conference_rooms
CREATE TRIGGER update_conference_rooms_updated_at
BEFORE UPDATE ON public.conference_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for conference_bookings
CREATE TRIGGER update_conference_bookings_updated_at
BEFORE UPDATE ON public.conference_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample conference room data
INSERT INTO public.conference_rooms (name, capacity, hourly_rate, description, features, status) VALUES 
('Executive Conference Room', 15, 175, 'Premium conference room with state-of-the-art technology and elegant furnishings, perfect for meetings, presentations, and corporate events.', 
ARRAY['4K Display', 'Video Conferencing', 'Premium Audio', 'Coffee Service', 'High-Speed WiFi', 'Whiteboard', 'Climate Control', 'Natural Light'], 'available');

-- Insert sample image for the conference room
INSERT INTO public.conference_room_images (conference_room_id, image_url, alt_text, display_order) VALUES 
(1, '/placeholder.svg', 'Executive Conference Room', 0);
-- Run this SQL directly in your Supabase Dashboard SQL Editor
-- This will create all the missing tables for your reports system

-- Create feedback table for customer reviews and ratings
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conference_bookings table for conference room reservations
CREATE TABLE IF NOT EXISTS public.conference_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conference_room_id INTEGER NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guest_service_requests table for service and maintenance requests
CREATE TABLE IF NOT EXISTS public.guest_service_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('maintenance', 'housekeeping', 'concierge', 'technical', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES public.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_service_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_booking_id ON public.feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_conference_bookings_user_id ON public.conference_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_conference_bookings_conference_room_id ON public.conference_bookings(conference_room_id);
CREATE INDEX IF NOT EXISTS idx_conference_bookings_start_datetime ON public.conference_bookings(start_datetime);
CREATE INDEX IF NOT EXISTS idx_conference_bookings_status ON public.conference_bookings(status);

CREATE INDEX IF NOT EXISTS idx_guest_service_requests_user_id ON public.guest_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_request_type ON public.guest_service_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_status ON public.guest_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_created_at ON public.guest_service_requests(created_at);

-- Create RLS policies for feedback table
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

-- Create RLS policies for conference_bookings table
CREATE POLICY "Users can view their own conference bookings" ON public.conference_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conference bookings" ON public.conference_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conference bookings" ON public.conference_bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conference bookings" ON public.conference_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "Admins can manage all conference bookings" ON public.conference_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

-- Create RLS policies for guest_service_requests table
CREATE POLICY "Users can view their own service requests" ON public.guest_service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create service requests" ON public.guest_service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests" ON public.guest_service_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service requests" ON public.guest_service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "Admins can manage all service requests" ON public.guest_service_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_conference_bookings_updated_at
  BEFORE UPDATE ON public.conference_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_guest_service_requests_updated_at
  BEFORE UPDATE ON public.guest_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data for testing
-- Sample feedback data
INSERT INTO public.feedback (user_id, booking_id, rating, message) VALUES
  ((SELECT id FROM public.users LIMIT 1), (SELECT id FROM public.bookings LIMIT 1), 5, 'Excellent service and clean rooms!'),
  ((SELECT id FROM public.users LIMIT 1), (SELECT id FROM public.bookings LIMIT 1), 4, 'Great stay, would recommend to others.'),
  ((SELECT id FROM public.users LIMIT 1), (SELECT id FROM public.bookings LIMIT 1), 5, 'Perfect experience from check-in to check-out.');

-- Sample conference booking data
INSERT INTO public.conference_bookings (user_id, conference_room_id, start_datetime, end_datetime, attendees, total_price, status) VALUES
  ((SELECT id FROM public.users LIMIT 1), 1, now() + interval '1 day', now() + interval '1 day' + interval '4 hours', 15, 200.00, 'booked'),
  ((SELECT id FROM public.users LIMIT 1), 1, now() + interval '3 days', now() + interval '3 days' + interval '6 hours', 25, 300.00, 'confirmed');

-- Sample service request data
INSERT INTO public.guest_service_requests (user_id, request_type, title, description, priority, status) VALUES
  ((SELECT id FROM public.users LIMIT 1), 'maintenance', 'AC not working', 'Air conditioning unit in room is not cooling properly', 'high', 'pending'),
  ((SELECT id FROM public.users LIMIT 1), 'housekeeping', 'Extra towels needed', 'Request for additional bath towels', 'medium', 'completed'),
  ((SELECT id FROM public.users LIMIT 1), 'concierge', 'Restaurant recommendation', 'Looking for local restaurant recommendations', 'low', 'completed');

-- Grant necessary permissions
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.conference_bookings TO authenticated;
GRANT ALL ON public.guest_service_requests TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Migration completed successfully! All missing tables have been created.' as status;



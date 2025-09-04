-- Simple SQL to create missing tables for Kabinda Lodge reports
-- Copy and paste this into your Supabase Dashboard SQL Editor

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create conference_bookings table
CREATE TABLE IF NOT EXISTS conference_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conference_room_id INTEGER NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create guest_service_requests table
CREATE TABLE IF NOT EXISTS guest_service_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('maintenance', 'housekeeping', 'concierge', 'technical', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_service_requests ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies
CREATE POLICY "Users can view their own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

CREATE POLICY "Users can view their own conference bookings" ON conference_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conference bookings" ON conference_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all conference bookings" ON conference_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

CREATE POLICY "Users can view their own service requests" ON guest_service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create service requests" ON guest_service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all service requests" ON guest_service_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

-- 6. Add sample data
INSERT INTO feedback (user_id, booking_id, rating, message) VALUES
  ((SELECT id FROM users LIMIT 1), (SELECT id FROM bookings LIMIT 1), 5, 'Excellent service!'),
  ((SELECT id FROM users LIMIT 1), (SELECT id FROM bookings LIMIT 1), 4, 'Great stay'),
  ((SELECT id FROM users LIMIT 1), (SELECT id FROM bookings LIMIT 1), 5, 'Perfect experience');

INSERT INTO conference_bookings (user_id, conference_room_id, start_datetime, end_datetime, attendees, total_price) VALUES
  ((SELECT id FROM users LIMIT 1), 1, now() + interval '1 day', now() + interval '1 day' + interval '4 hours', 15, 200.00),
  ((SELECT id FROM users LIMIT 1), 1, now() + interval '3 days', now() + interval '3 days' + interval '6 hours', 25, 300.00);

INSERT INTO guest_service_requests (user_id, request_type, title, description, priority) VALUES
  ((SELECT id FROM users LIMIT 1), 'maintenance', 'AC not working', 'Air conditioning unit not cooling properly', 'high'),
  ((SELECT id FROM users LIMIT 1), 'housekeeping', 'Extra towels', 'Request for additional bath towels', 'medium'),
  ((SELECT id FROM users LIMIT 1), 'concierge', 'Restaurant recommendation', 'Looking for local restaurant recommendations', 'low');

-- 7. Grant permissions
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON conference_bookings TO authenticated;
GRANT ALL ON guest_service_requests TO authenticated;

-- Success message
SELECT 'Tables created successfully! Your reports should now work.' as result;



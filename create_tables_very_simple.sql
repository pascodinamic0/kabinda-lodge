-- Very simple table creation - run this step by step
-- Copy and paste each section separately in Supabase SQL Editor

-- STEP 1: Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 2: Create conference_bookings table
CREATE TABLE IF NOT EXISTS conference_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  conference_room_id INTEGER NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 3: Create guest_service_requests table
CREATE TABLE IF NOT EXISTS guest_service_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 4: Add sample data
INSERT INTO feedback (user_id, booking_id, rating, message) VALUES
  ('00000000-0000-0000-0000-000000000000', 1, 5, 'Excellent service!'),
  ('00000000-0000-0000-0000-000000000000', 1, 4, 'Great stay'),
  ('00000000-0000-0000-0000-000000000000', 1, 5, 'Perfect experience');

INSERT INTO conference_bookings (user_id, conference_room_id, start_datetime, end_datetime, attendees, total_price) VALUES
  ('00000000-0000-0000-0000-000000000000', 1, now() + interval '1 day', now() + interval '1 day' + interval '4 hours', 15, 200.00),
  ('00000000-0000-0000-0000-000000000000', 1, now() + interval '3 days', now() + interval '3 days' + interval '6 hours', 25, 300.00);

INSERT INTO guest_service_requests (user_id, request_type, title, description, priority) VALUES
  ('00000000-0000-0000-0000-000000000000', 'maintenance', 'AC not working', 'Air conditioning unit not cooling properly', 'high'),
  ('00000000-0000-0000-0000-000000000000', 'housekeeping', 'Extra towels', 'Request for additional bath towels', 'medium'),
  ('00000000-0000-0000-0000-000000000000', 'concierge', 'Restaurant recommendation', 'Looking for local restaurant recommendations', 'low');

-- STEP 5: Check results
SELECT 'Tables created and populated with sample data' as result;



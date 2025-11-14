-- Check if tables exist and have data
-- Run this in your Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('feedback', 'conference_bookings', 'guest_service_requests')
AND table_schema = 'public';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'feedback' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if tables have data
SELECT 
  'feedback' as table_name,
  COUNT(*) as row_count
FROM feedback
UNION ALL
SELECT 
  'conference_bookings' as table_name,
  COUNT(*) as row_count
FROM conference_bookings
UNION ALL
SELECT 
  'guest_service_requests' as table_name,
  COUNT(*) as row_count
FROM guest_service_requests;

-- 4. Check sample data
SELECT 'feedback sample' as type, id, rating, message FROM feedback LIMIT 3;
SELECT 'conference_bookings sample' as type, id, attendees, total_price, status FROM conference_bookings LIMIT 3;
SELECT 'guest_service_requests sample' as type, id, request_type, title, priority FROM guest_service_requests LIMIT 3;



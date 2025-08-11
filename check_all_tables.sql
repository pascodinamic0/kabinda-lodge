-- Check all available tables in your database
-- Run this in your Supabase SQL Editor

-- List all tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if key tables exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN 'EXISTS' ELSE 'MISSING' END as bookings,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN 'EXISTS' ELSE 'MISSING' END as orders,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN 'EXISTS' ELSE 'MISSING' END as rooms,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN 'EXISTS' ELSE 'MISSING' END as users,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN 'EXISTS' ELSE 'MISSING' END as menu_items,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN 'EXISTS' ELSE 'MISSING' END as payments,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN 'EXISTS' ELSE 'MISSING' END as feedback,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conference_bookings') THEN 'EXISTS' ELSE 'MISSING' END as conference_bookings,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_service_requests') THEN 'EXISTS' ELSE 'MISSING' END as guest_service_requests;

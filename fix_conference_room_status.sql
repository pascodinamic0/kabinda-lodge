-- Script to check and fix conference room status issues
-- Run this to see which rooms are incorrectly marked as occupied

-- Check conference rooms and their active bookings
SELECT 
  cr.id,
  cr.name,
  cr.status as room_status,
  cb.id as booking_id,
  cb.start_datetime,
  cb.end_datetime,
  cb.status as booking_status,
  CASE 
    WHEN cb.start_datetime <= NOW() AND cb.end_datetime >= NOW() THEN 'ACTIVE'
    WHEN cb.end_datetime < NOW() THEN 'EXPIRED'
    WHEN cb.start_datetime > NOW() THEN 'FUTURE'
    ELSE 'NO BOOKING'
  END as booking_time_status
FROM conference_rooms cr
LEFT JOIN conference_bookings cb ON cb.conference_room_id = cr.id AND cb.status = 'booked'
WHERE cr.status = 'occupied'
ORDER BY cr.name;

-- Fix rooms that should be available (bookings have expired)
UPDATE conference_rooms 
SET status = 'available' 
WHERE id IN (
  SELECT cr.id 
  FROM conference_rooms cr
  WHERE cr.status = 'occupied'
    AND NOT EXISTS (
      SELECT 1 FROM conference_bookings cb 
      WHERE cb.conference_room_id = cr.id 
        AND cb.status = 'booked'
        AND cb.start_datetime <= NOW()
        AND cb.end_datetime >= NOW()
    )
);

-- Show the results
SELECT 
  id,
  name,
  status,
  'Fixed' as action
FROM conference_rooms
WHERE status = 'available'
ORDER BY name;


-- Test queries to check room types functionality

-- 1. Check if room_types table exists and has data
SELECT COUNT(*) as room_types_count FROM room_types;

-- 2. Show all room types
SELECT * FROM room_types ORDER BY name;

-- 3. Check if rooms table references room types correctly
SELECT 
  r.id,
  r.name,
  r.type,
  rt.id as room_type_id,
  rt.name as room_type_name
FROM rooms r
LEFT JOIN room_types rt ON r.type = rt.name
LIMIT 10;

-- 4. Check if amenities table exists
SELECT COUNT(*) as amenities_count FROM amenities;

-- 5. Check if room_amenities table exists
SELECT COUNT(*) as room_amenities_count FROM room_amenities;

-- 6. If room_type_amenities table exists, check it
-- SELECT COUNT(*) as room_type_amenities_count FROM room_type_amenities;






-- Debug script to check amenities data flow
-- Run this in your Supabase SQL Editor

-- 1. Check if amenities table has data
SELECT 'Amenities Table' as table_name, COUNT(*) as count FROM amenities
UNION ALL
SELECT 'Room Types Table' as table_name, COUNT(*) as count FROM room_types
UNION ALL
SELECT 'Room Type Amenities Table' as table_name, COUNT(*) as count FROM room_type_amenities;

-- 2. Show all amenities
SELECT 'All Amenities:' as info;
SELECT id, name, icon_name, category FROM amenities ORDER BY category, name;

-- 3. Show all room types
SELECT 'All Room Types:' as info;
SELECT id, name, description FROM room_types ORDER BY name;

-- 4. Show room type amenities relationships
SELECT 'Room Type Amenities:' as info;
SELECT 
  rt.name as room_type_name,
  a.name as amenity_name,
  a.category as amenity_category
FROM room_type_amenities rta
JOIN room_types rt ON rta.room_type_id = rt.id
JOIN amenities a ON rta.amenity_id = a.id
ORDER BY rt.name, a.category, a.name;

-- 5. Check a specific room type (replace 'Standard Double' with your room type)
SELECT 'Specific Room Type Amenities:' as info;
SELECT 
  rt.name as room_type_name,
  a.name as amenity_name,
  a.icon_name,
  a.category
FROM room_types rt
LEFT JOIN room_type_amenities rta ON rt.id = rta.room_type_id
LEFT JOIN amenities a ON rta.amenity_id = a.id
WHERE rt.name = 'Standard Double';  -- Change this to your room type name

-- 6. Check if room_type_amenities table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'room_type_amenities'
) as room_type_amenities_table_exists;

-- Test the complete amenities flow
-- Run this in your Supabase SQL Editor to debug the issue

-- Step 1: Check if we have amenities
SELECT 'Step 1: Checking amenities table' as step;
SELECT COUNT(*) as amenity_count FROM amenities;

-- Step 2: Check if we have room types
SELECT 'Step 2: Checking room types table' as step;
SELECT id, name FROM room_types ORDER BY name;

-- Step 3: Check if room_type_amenities table exists
SELECT 'Step 3: Checking room_type_amenities table' as step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'room_type_amenities'
) as table_exists;

-- Step 4: If table exists, check for relationships
SELECT 'Step 4: Checking room type amenities relationships' as step;
SELECT 
  rt.name as room_type_name,
  a.name as amenity_name,
  a.icon_name,
  a.category
FROM room_types rt
LEFT JOIN room_type_amenities rta ON rt.id = rta.room_type_id
LEFT JOIN amenities a ON rta.amenity_id = a.id
ORDER BY rt.name, a.name;

-- Step 5: Test query similar to frontend
SELECT 'Step 5: Testing frontend-like query' as step;
-- Replace 'Standard Double' with your actual room type name
SELECT 
  rt.id,
  rt.name,
  rta.amenities
FROM room_types rt
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'icon_name', a.icon_name,
      'category', a.category
    )
  ) as amenities
  FROM room_type_amenities rta2
  JOIN amenities a ON rta2.amenity_id = a.id
  WHERE rta2.room_type_id = rt.id
) rta ON true
WHERE rt.name = 'Standard Double';  -- Change this to your room type name

-- Step 6: Show all room types with their amenities count
SELECT 'Step 6: Room types with amenities count' as step;
SELECT 
  rt.name,
  COUNT(rta.amenity_id) as amenities_count
FROM room_types rt
LEFT JOIN room_type_amenities rta ON rt.id = rta.room_type_id
GROUP BY rt.id, rt.name
ORDER BY rt.name;


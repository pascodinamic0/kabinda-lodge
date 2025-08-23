-- Consolidate all menu items to the main restaurant (The Grand Terrace - ID 1)
UPDATE menu_items SET restaurant_id = 1 WHERE restaurant_id IN (2, 3, 4);

-- Update menu item categories to be more generic since we only have one restaurant
UPDATE menu_items SET category = 
  CASE 
    WHEN category IN ('Appetizers', 'Starters') THEN 'Appetizers'
    WHEN category IN ('Main Course', 'Mains', 'Entrees', 'Grilled Items') THEN 'Main Courses'
    WHEN category IN ('Dessert', 'Desserts', 'Sweets') THEN 'Desserts'
    WHEN category IN ('Beverage', 'Beverages', 'Drinks', 'Cocktails') THEN 'Beverages'
    WHEN category IN ('Salad', 'Salads') THEN 'Salads'
    WHEN category IN ('Soup', 'Soups') THEN 'Soups'
    ELSE category
  END;

-- Update the main restaurant details to be more generic
UPDATE restaurants 
SET 
  name = 'Kabinda Lodge Restaurant',
  type = 'Hotel Restaurant',
  cuisine = 'International Cuisine',
  location = 'Main Building',
  description = 'Our signature restaurant offering a diverse menu of international and local dishes in an elegant setting.'
WHERE id = 1;

-- Remove other restaurants but keep their menu items (already moved to restaurant 1)
DELETE FROM restaurants WHERE id IN (2, 3, 4);

-- Update any dining reservations to point to the main restaurant
UPDATE dining_reservations SET restaurant_id = 1 WHERE restaurant_id IN (2, 3, 4);

-- Update restaurant images to point to the main restaurant
UPDATE restaurant_images SET restaurant_id = 1 WHERE restaurant_id IN (2, 3, 4);
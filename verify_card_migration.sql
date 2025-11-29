-- Run this in Supabase SQL Editor to verify if the migration was applied
-- If you see rows for 'card_uid', 'programming_status', and 'card_programming_log', then you are good to go!

SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE table_name = 'key_cards' 
AND column_name IN ('card_uid', 'programming_status', 'programming_data')

UNION ALL

SELECT 
    table_name, 
    'EXISTENCE_CHECK' as column_name
FROM information_schema.tables 
WHERE table_name = 'card_programming_log';











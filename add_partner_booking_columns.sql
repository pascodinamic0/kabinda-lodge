-- Add partner promotion tracking columns to bookings table
-- This allows bookings to store which promotion was used and the discount details

-- Add columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES public.promotions(id) ON DELETE SET NULL;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS original_price NUMERIC;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN ('promotion_id', 'original_price', 'discount_amount')
ORDER BY column_name;

-- Show a success message
DO $$
BEGIN
    RAISE NOTICE '✅ Partner promotion columns added to bookings table successfully!';
    RAISE NOTICE 'The following columns are now available:';
    RAISE NOTICE '  - promotion_id: Links to the partner promotion used';
    RAISE NOTICE '  - original_price: Stores the original price before discount';
    RAISE NOTICE '  - discount_amount: Stores the discount amount applied';
END $$;










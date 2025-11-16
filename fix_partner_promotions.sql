-- Fix partner promotions data
-- This script ensures all partner promotions have the correct promotion_type and structure

-- First, check if we have the constraint issue and drop it if needed
DO $$ 
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'promotion_type_check' 
        AND conrelid = 'public.promotions'::regclass
    ) THEN
        ALTER TABLE public.promotions DROP CONSTRAINT promotion_type_check;
    END IF;
END $$;

-- Add or recreate the constraint with the correct values
-- Support both 'general'/'partner' and 'standard'/'partner' for compatibility
ALTER TABLE public.promotions 
ADD CONSTRAINT promotion_type_check 
CHECK (promotion_type IN ('general', 'partner', 'standard'));

-- Update any promotions that might have 'standard' to 'general' for consistency
UPDATE public.promotions 
SET promotion_type = 'general' 
WHERE promotion_type = 'standard';

-- Ensure all existing partner promotions have the is_active flag set
UPDATE public.promotions 
SET is_active = true 
WHERE promotion_type = 'partner' AND is_active IS NULL;

-- Update any partner promotions that don't have proper discount_type set
UPDATE public.promotions 
SET discount_type = CASE 
    WHEN discount_amount > 0 AND discount_amount IS NOT NULL THEN 'fixed'
    ELSE 'percentage'
END
WHERE promotion_type = 'partner' AND discount_type IS NULL;

-- Ensure current_uses is initialized
UPDATE public.promotions 
SET current_uses = 0 
WHERE current_uses IS NULL;

-- Ensure minimum_amount has a default
UPDATE public.promotions 
SET minimum_amount = 0 
WHERE minimum_amount IS NULL AND promotion_type = 'partner';

-- Display the updated promotions
SELECT 
    id,
    title,
    promotion_type,
    partner_name,
    discount_type,
    discount_percent,
    discount_amount,
    minimum_amount,
    maximum_uses,
    current_uses,
    is_active,
    start_date,
    end_date
FROM public.promotions
WHERE promotion_type = 'partner'
ORDER BY created_at DESC;










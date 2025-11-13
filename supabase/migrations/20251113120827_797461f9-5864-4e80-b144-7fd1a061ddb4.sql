-- Add missing columns to promotions table for partner promotions feature
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS promotion_type text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_amount numeric,
ADD COLUMN IF NOT EXISTS partner_name text,
ADD COLUMN IF NOT EXISTS minimum_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS maximum_uses integer,
ADD COLUMN IF NOT EXISTS current_uses integer DEFAULT 0;

-- Add check constraint for promotion_type
ALTER TABLE public.promotions 
ADD CONSTRAINT promotion_type_check 
CHECK (promotion_type IN ('standard', 'partner'));

-- Add check constraint for discount_type
ALTER TABLE public.promotions 
ADD CONSTRAINT discount_type_check 
CHECK (discount_type IN ('percentage', 'fixed'));

-- Create index for faster partner promotion queries
CREATE INDEX IF NOT EXISTS idx_promotions_type_active 
ON public.promotions(promotion_type, is_active, start_date, end_date);

-- Add comment explaining the columns
COMMENT ON COLUMN public.promotions.promotion_type IS 'Type of promotion: standard (public) or partner (corporate)';
COMMENT ON COLUMN public.promotions.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN public.promotions.discount_amount IS 'Fixed discount amount (used when discount_type is fixed)';
COMMENT ON COLUMN public.promotions.partner_name IS 'Name of the partner company (for partner promotions)';
COMMENT ON COLUMN public.promotions.minimum_amount IS 'Minimum booking amount required to use this promotion';
COMMENT ON COLUMN public.promotions.maximum_uses IS 'Maximum number of times this promotion can be used';
COMMENT ON COLUMN public.promotions.current_uses IS 'Current number of times this promotion has been used';

-- Insert sample partner promotions for testing
INSERT INTO public.promotions (
  title, 
  description, 
  discount_percent, 
  discount_type,
  discount_amount,
  promotion_type,
  partner_name,
  minimum_amount,
  maximum_uses,
  start_date, 
  end_date,
  is_active
) VALUES 
(
  'Corporate Partnership - Tech Corp',
  'Exclusive 20% discount for Tech Corp employees on all room bookings',
  20,
  'percentage',
  NULL,
  'partner',
  'Tech Corp',
  100,
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  true
),
(
  'Fixed Rate Partner - NGO Alliance',
  '$50 flat discount on bookings for NGO Alliance members',
  0,
  'fixed',
  50,
  'partner',
  'NGO Alliance',
  200,
  500,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  true
),
(
  'Premium Partner - Business Hub',
  '25% discount for Business Hub corporate accounts',
  25,
  'percentage',
  NULL,
  'partner',
  'Business Hub',
  150,
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  true
)
ON CONFLICT DO NOTHING;
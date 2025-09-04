-- Add partner promotions support
-- Extend the promotions table to include partner information

-- Add columns for partner promotions
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS promotion_type TEXT NOT NULL DEFAULT 'general' CHECK (promotion_type IN ('general', 'partner'));
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS partner_contact_info TEXT;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS minimum_amount NUMERIC DEFAULT 0;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS maximum_uses INTEGER;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC;

-- Create partner_promotion_usages table to track when partner promotions are used
CREATE TABLE IF NOT EXISTS public.partner_promotion_usages (
  id SERIAL PRIMARY KEY,
  promotion_id INTEGER NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
  conference_booking_id INTEGER REFERENCES public.conference_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  original_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  applied_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT booking_type_check CHECK (
    (booking_id IS NOT NULL AND conference_booking_id IS NULL) OR 
    (booking_id IS NULL AND conference_booking_id IS NOT NULL)
  )
);

-- Enable RLS on the new table
ALTER TABLE public.partner_promotion_usages ENABLE ROW LEVEL SECURITY;

-- Create policies for partner_promotion_usages
CREATE POLICY "Staff can view promotion usages" 
ON public.partner_promotion_usages 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can create promotion usages" 
ON public.partner_promotion_usages 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- Add booking promotion tracking columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES public.promotions(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

ALTER TABLE public.conference_bookings ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES public.promotions(id) ON DELETE SET NULL;
ALTER TABLE public.conference_bookings ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.conference_bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Create function to apply partner promotion
CREATE OR REPLACE FUNCTION apply_partner_promotion(
  p_promotion_id INTEGER,
  p_booking_amount NUMERIC,
  p_booking_id INTEGER DEFAULT NULL,
  p_conference_booking_id INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_applied_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_promotion RECORD;
  v_discount_amount NUMERIC;
  v_final_amount NUMERIC;
  v_usage_id INTEGER;
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_applied_by UUID := COALESCE(p_applied_by, auth.uid());
BEGIN
  -- Get promotion details
  SELECT * INTO v_promotion
  FROM public.promotions 
  WHERE id = p_promotion_id 
  AND promotion_type = 'partner'
  AND is_active = true
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or inactive partner promotion'
    );
  END IF;
  
  -- Check minimum amount
  IF p_booking_amount < v_promotion.minimum_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Minimum amount required: %s', v_promotion.minimum_amount)
    );
  END IF;
  
  -- Check maximum uses
  IF v_promotion.maximum_uses IS NOT NULL AND v_promotion.current_uses >= v_promotion.maximum_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Promotion usage limit reached'
    );
  END IF;
  
  -- Calculate discount based on type
  IF v_promotion.discount_type = 'fixed' THEN
    v_discount_amount := v_promotion.discount_amount;
  ELSE
    v_discount_amount := p_booking_amount * (v_promotion.discount_percent / 100.0);
  END IF;
  
  -- Ensure discount doesn't exceed booking amount
  IF v_discount_amount > p_booking_amount THEN
    v_discount_amount := p_booking_amount;
  END IF;
  
  v_final_amount := p_booking_amount - v_discount_amount;
  
  -- Record the usage
  INSERT INTO public.partner_promotion_usages (
    promotion_id,
    booking_id,
    conference_booking_id,
    user_id,
    discount_amount,
    original_amount,
    final_amount,
    applied_by
  ) VALUES (
    p_promotion_id,
    p_booking_id,
    p_conference_booking_id,
    v_user_id,
    v_discount_amount,
    p_booking_amount,
    v_final_amount,
    v_applied_by
  ) RETURNING id INTO v_usage_id;
  
  -- Update promotion usage count
  UPDATE public.promotions 
  SET current_uses = current_uses + 1 
  WHERE id = p_promotion_id;
  
  RETURN json_build_object(
    'success', true,
    'usage_id', v_usage_id,
    'original_amount', p_booking_amount,
    'discount_amount', v_discount_amount,
    'final_amount', v_final_amount,
    'discount_percent', v_promotion.discount_percent,
    'promotion_title', v_promotion.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample partner promotions
INSERT INTO public.promotions (title, discount_percent, discount_amount, discount_type, start_date, end_date, promotion_type, partner_name, minimum_amount, maximum_uses, is_active) VALUES
('TechCorp Employee Discount', 15, NULL, 'percentage', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 'partner', 'TechCorp', 0, NULL, true),
('Government Rate', 0, 50, 'fixed', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'partner', 'Government Relations', 0, NULL, true),
('Elite Travel Discount', 12, NULL, 'percentage', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'partner', 'Elite Travel', 0, NULL, true);

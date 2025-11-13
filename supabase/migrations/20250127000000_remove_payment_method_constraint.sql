-- Remove the hardcoded payment method constraint to allow dynamic payment methods
-- Payment methods are now managed through the payment_methods table

ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_method_check;

-- The payment method field will now accept any text value
-- This allows the admin to configure payment methods dynamically through the payment_methods table
-- The application will validate that only active payment methods from the payment_methods table are used






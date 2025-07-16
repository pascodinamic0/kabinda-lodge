-- Add Pepele Mobile to the allowed payment methods
ALTER TABLE public.payments DROP CONSTRAINT payments_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_method_check 
CHECK (method = ANY (ARRAY['Airtel Money DRC'::text, 'Vodacom M-Pesa DRC'::text, 'Equity BCDC'::text, 'Pepele Mobile'::text]));
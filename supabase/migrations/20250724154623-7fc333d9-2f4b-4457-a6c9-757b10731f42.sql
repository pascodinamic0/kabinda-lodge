-- Create table for managing available payment methods
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  icon_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for managing bank accounts
CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  routing_number text,
  swift_code text,
  branch text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Everyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

-- Create policies for bank_accounts  
CREATE POLICY "Admins can manage bank accounts" 
ON public.bank_accounts 
FOR ALL 
USING (get_current_user_role() = 'Admin'::app_role);

CREATE POLICY "Staff can view active bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (is_active = true AND get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'RestaurantLead'::app_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, code, description, icon_name) VALUES
('Cash', 'cash', 'Cash payment at location', 'banknote'),
('Vodacom M-Pesa', 'vodacom_mpesa', 'Mobile money via Vodacom M-Pesa', 'smartphone'),
('Orange Money', 'orange_money', 'Mobile money via Orange Money', 'smartphone'),
('Airtel Money', 'airtel_money', 'Mobile money via Airtel Money', 'smartphone'),
('Bank Transfer', 'bank_transfer', 'Direct bank transfer', 'building-2');
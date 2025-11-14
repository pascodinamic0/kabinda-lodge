-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money'));

-- Add kitchen_printer_id column to restaurant_tables table
ALTER TABLE public.restaurant_tables 
ADD COLUMN kitchen_printer_id TEXT;

-- Add comment to explain the kitchen_printer_id usage
COMMENT ON COLUMN public.restaurant_tables.kitchen_printer_id IS 'ID of the kitchen printer assigned to this table for order routing';

-- Update orders table to include more detailed status tracking
ALTER TABLE public.orders 
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN estimated_completion_time TIMESTAMP WITH TIME ZONE;

-- Create order_status_history table for tracking status changes
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for order_status_history
CREATE POLICY "Restaurant staff can view order status history" 
ON public.order_status_history 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

CREATE POLICY "Restaurant staff can insert order status history" 
ON public.order_status_history 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'RestaurantLead'::app_role]));

-- Add index for better performance
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
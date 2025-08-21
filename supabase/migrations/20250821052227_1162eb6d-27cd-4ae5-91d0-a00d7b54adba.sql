-- Create lost_items table for persistent storage
CREATE TABLE public.lost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  description TEXT,
  location_found TEXT,
  date_found DATE NOT NULL,
  found_by TEXT,
  contact_info TEXT,
  status TEXT NOT NULL DEFAULT 'unclaimed',
  claimed_by TEXT,
  claimed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

-- Create policies for lost items management
CREATE POLICY "Staff can manage lost items" 
ON public.lost_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can view lost items" 
ON public.lost_items 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_lost_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lost_items_updated_at
BEFORE UPDATE ON public.lost_items
FOR EACH ROW
EXECUTE FUNCTION public.update_lost_items_updated_at();
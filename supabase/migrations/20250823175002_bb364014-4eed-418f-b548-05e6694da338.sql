-- Create maintenance_requests table with proper structure and RLS policies
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number text NOT NULL,
  issue_type text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'reported',
  reported_by text NOT NULL,
  assigned_to uuid NULL,
  scheduled_date timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Add constraints for valid values
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('reported', 'scheduled', 'in_progress', 'completed'))
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance requests
CREATE POLICY "Staff can view all maintenance requests" 
ON public.maintenance_requests 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can create maintenance requests" 
ON public.maintenance_requests 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can update maintenance requests" 
ON public.maintenance_requests 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can delete maintenance requests" 
ON public.maintenance_requests 
FOR DELETE 
USING (get_current_user_role() = 'SuperAdmin'::app_role);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests (status);
CREATE INDEX idx_maintenance_requests_room ON public.maintenance_requests (room_number);
CREATE INDEX idx_maintenance_requests_created_at ON public.maintenance_requests (created_at DESC);

-- Insert sample data for testing
INSERT INTO public.maintenance_requests (room_number, issue_type, description, priority, status, reported_by) VALUES
('101', 'Plumbing', 'Leaky faucet in bathroom sink', 'medium', 'reported', 'John Doe (Reception)'),
('205', 'HVAC', 'Air conditioning not working properly', 'high', 'scheduled', 'Guest via phone'),
('304', 'Electrical', 'Light fixture flickering in bedroom', 'low', 'reported', 'Housekeeping Staff'),
('156', 'Appliances', 'TV remote not working', 'low', 'in_progress', 'Guest complaint'),
('210', 'Safety/Security', 'Door lock mechanism jammed', 'urgent', 'completed', 'Security Team');
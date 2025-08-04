-- Create guest service requests table
CREATE TABLE public.guest_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  room_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.guest_service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for guest service requests
CREATE POLICY "Guests can create their own service requests" 
ON public.guest_service_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can view their own service requests" 
ON public.guest_service_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all service requests" 
ON public.guest_service_requests 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can update service requests" 
ON public.guest_service_requests 
FOR UPDATE 
USING (get_current_user_role() = ANY(ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_guest_service_requests_updated_at
  BEFORE UPDATE ON public.guest_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
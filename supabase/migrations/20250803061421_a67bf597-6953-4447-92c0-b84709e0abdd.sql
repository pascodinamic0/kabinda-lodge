-- Create incidents table for incident reporting
CREATE TABLE public.incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by uuid NOT NULL,
  incident_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  location text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create housekeeping_tasks table
CREATE TABLE public.housekeeping_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id integer,
  task_type text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  description text,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'pending',
  estimated_duration integer, -- in minutes
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create key_cards table
CREATE TABLE public.key_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number text NOT NULL UNIQUE,
  room_id integer,
  guest_id uuid,
  status text NOT NULL DEFAULT 'inactive',
  issued_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents
CREATE POLICY "Staff can manage incidents" 
ON public.incidents 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can view incidents" 
ON public.incidents 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- RLS Policies for housekeeping_tasks
CREATE POLICY "Staff can manage housekeeping tasks" 
ON public.housekeeping_tasks 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can view housekeeping tasks" 
ON public.housekeeping_tasks 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- RLS Policies for key_cards
CREATE POLICY "Staff can manage key cards" 
ON public.key_cards 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can view key cards" 
ON public.key_cards 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Add triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_housekeeping_tasks_updated_at
BEFORE UPDATE ON public.housekeeping_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_cards_updated_at
BEFORE UPDATE ON public.key_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
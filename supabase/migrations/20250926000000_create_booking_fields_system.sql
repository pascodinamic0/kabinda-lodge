-- Create booking_fields_config table for dynamic booking fields
CREATE TABLE IF NOT EXISTS public.booking_fields_config (
  id SERIAL PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'number', 'select', 'textarea', 'date', 'checkbox')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT[] NOT NULL DEFAULT ARRAY['room']::TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  options TEXT[] DEFAULT NULL, -- For select/dropdown fields
  placeholder TEXT,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_field_values table to store dynamic field values
CREATE TABLE IF NOT EXISTS public.booking_field_values (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES public.booking_fields_config(id) ON DELETE CASCADE,
  field_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, field_id)
);

-- Create conference_booking_field_values table for conference room bookings
CREATE TABLE IF NOT EXISTS public.conference_booking_field_values (
  id SERIAL PRIMARY KEY,
  conference_booking_id INTEGER NOT NULL REFERENCES public.conference_bookings(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES public.booking_fields_config(id) ON DELETE CASCADE,
  field_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conference_booking_id, field_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_field_values_booking_id ON public.booking_field_values(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_field_values_field_id ON public.booking_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_conference_booking_field_values_booking_id ON public.conference_booking_field_values(conference_booking_id);
CREATE INDEX IF NOT EXISTS idx_conference_booking_field_values_field_id ON public.conference_booking_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_booking_fields_config_applies_to ON public.booking_fields_config USING GIN(applies_to);
CREATE INDEX IF NOT EXISTS idx_booking_fields_config_active ON public.booking_fields_config(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.booking_fields_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_booking_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_fields_config
-- Everyone can view active fields
CREATE POLICY "Everyone can view active booking fields"
ON public.booking_fields_config
FOR SELECT
USING (is_active = true);

-- Admins and SuperAdmins can manage all fields
CREATE POLICY "Admins can manage booking fields"
ON public.booking_fields_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'SuperAdmin'::app_role)
  )
);

-- RLS Policies for booking_field_values
-- Users can view their own booking field values
CREATE POLICY "Users can view their own booking field values"
ON public.booking_field_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_field_values.booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- Users can insert their own booking field values
CREATE POLICY "Users can insert their own booking field values"
ON public.booking_field_values
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_field_values.booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- Users can update their own booking field values
CREATE POLICY "Users can update their own booking field values"
ON public.booking_field_values
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_field_values.booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- RLS Policies for conference_booking_field_values
-- Users can view their own conference booking field values
CREATE POLICY "Users can view their own conference booking field values"
ON public.conference_booking_field_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conference_bookings
    WHERE id = conference_booking_field_values.conference_booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- Users can insert their own conference booking field values
CREATE POLICY "Users can insert their own conference booking field values"
ON public.conference_booking_field_values
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conference_bookings
    WHERE id = conference_booking_field_values.conference_booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- Users can update their own conference booking field values
CREATE POLICY "Users can update their own conference booking field values"
ON public.conference_booking_field_values
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conference_bookings
    WHERE id = conference_booking_field_values.conference_booking_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role)
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_booking_fields_config_updated_at
BEFORE UPDATE ON public.booking_fields_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_field_values_updated_at
BEFORE UPDATE ON public.booking_field_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conference_booking_field_values_updated_at
BEFORE UPDATE ON public.conference_booking_field_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();






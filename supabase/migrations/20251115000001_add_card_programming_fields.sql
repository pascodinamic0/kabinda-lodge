-- Add card programming status and tracking fields to key_cards table

-- Add new columns to key_cards
ALTER TABLE public.key_cards
ADD COLUMN IF NOT EXISTS card_uid text,
ADD COLUMN IF NOT EXISTS card_type text,
ADD COLUMN IF NOT EXISTS booking_id integer REFERENCES public.bookings(id),
ADD COLUMN IF NOT EXISTS programming_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS programming_data jsonb,
ADD COLUMN IF NOT EXISTS last_programmed_at timestamp with time zone;

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_key_cards_booking_id ON public.key_cards(booking_id);

-- Create index on card_uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_key_cards_card_uid ON public.key_cards(card_uid);

-- Add comment to columns
COMMENT ON COLUMN public.key_cards.card_uid IS 'Unique identifier read from the physical card';
COMMENT ON COLUMN public.key_cards.card_type IS 'Type of card: authorization_1, installation, authorization_2, clock, room';
COMMENT ON COLUMN public.key_cards.booking_id IS 'Associated booking ID';
COMMENT ON COLUMN public.key_cards.programming_status IS 'Status: pending, programming, success, failed';
COMMENT ON COLUMN public.key_cards.programming_data IS 'Data written to the card during programming';
COMMENT ON COLUMN public.key_cards.last_programmed_at IS 'Timestamp of last successful programming';

-- Create card_programming_log table for tracking all programming attempts
CREATE TABLE IF NOT EXISTS public.card_programming_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id integer REFERENCES public.bookings(id),
  card_id uuid REFERENCES public.key_cards(id),
  card_type text NOT NULL,
  card_uid text,
  status text NOT NULL, -- success, failed, retry
  error_message text,
  programming_data jsonb,
  programmed_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on card_programming_log
ALTER TABLE public.card_programming_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_programming_log
CREATE POLICY "Staff can view card programming log"
ON public.card_programming_log
FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

CREATE POLICY "Staff can insert card programming log"
ON public.card_programming_log
FOR INSERT
WITH CHECK (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- Create indexes for card_programming_log
CREATE INDEX IF NOT EXISTS idx_card_programming_log_booking_id ON public.card_programming_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_card_programming_log_card_id ON public.card_programming_log(card_id);
CREATE INDEX IF NOT EXISTS idx_card_programming_log_created_at ON public.card_programming_log(created_at DESC);

-- Add comments
COMMENT ON TABLE public.card_programming_log IS 'Audit log of all card programming attempts';
COMMENT ON COLUMN public.card_programming_log.status IS 'Programming status: success, failed, retry';
COMMENT ON COLUMN public.card_programming_log.programming_data IS 'Data that was written or attempted to write to the card';
COMMENT ON COLUMN public.card_programming_log.programmed_by IS 'User who initiated the programming';





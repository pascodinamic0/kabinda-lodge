-- Create the review_requests table
CREATE TABLE public.review_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id integer NOT NULL,
  user_id uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for review_requests
CREATE POLICY "Staff can manage review requests" ON public.review_requests
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

CREATE POLICY "Staff can view review requests" ON public.review_requests
FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Add foreign key constraints
ALTER TABLE public.review_requests 
ADD CONSTRAINT review_requests_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.review_requests 
ADD CONSTRAINT review_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key constraint between bookings and users
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_review_requests_updated_at
BEFORE UPDATE ON public.review_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
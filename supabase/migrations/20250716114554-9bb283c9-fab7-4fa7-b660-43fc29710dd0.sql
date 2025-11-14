-- Create feedback table for guest reviews
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT feedback_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Guests can create feedback for their bookings" 
ON public.feedback 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Guests can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Staff can view all feedback" 
ON public.feedback 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role]));

-- Index for performance
CREATE INDEX idx_feedback_booking_id ON public.feedback(booking_id);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);
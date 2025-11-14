-- Create function to handle review request insert
CREATE OR REPLACE FUNCTION public.handle_review_request_insert(
  p_booking_id integer,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.review_requests (booking_id, user_id, sent_at, status)
  VALUES (p_booking_id, p_user_id, now(), 'sent');
END;
$$;
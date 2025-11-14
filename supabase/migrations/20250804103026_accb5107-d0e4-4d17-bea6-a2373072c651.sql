-- Fix security warning: Set search_path for new function
CREATE OR REPLACE FUNCTION public.log_payment_verification(
  p_payment_id integer,
  p_booking_id integer,
  p_verified_by uuid,
  p_approved boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'payment_verification',
    p_verified_by,
    jsonb_build_object(
      'payment_id', p_payment_id,
      'booking_id', p_booking_id,
      'approved', p_approved,
      'error_message', p_error_message,
      'timestamp', now()
    )
  );
END;
$$;
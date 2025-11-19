-- Add delete booking function for SuperAdmin
DROP FUNCTION IF EXISTS public.delete_booking_as_superadmin(integer, text);

CREATE OR REPLACE FUNCTION public.delete_booking_as_superadmin(
  p_booking_id integer,
  p_booking_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_room_id integer;
  v_conference_room_id integer;
  v_result json;
BEGIN
  -- Only SuperAdmins can call this function
  IF public.get_current_user_role() != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: SuperAdmin role required';
  END IF;

  -- Handle hotel booking deletion
  IF p_booking_type = 'hotel' THEN
    -- Get room_id before deleting
    SELECT b.room_id INTO v_room_id
    FROM public.bookings b
    WHERE b.id = p_booking_id;
    
    IF v_room_id IS NULL THEN
      RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Delete related payments first
    DELETE FROM public.payments WHERE payments.booking_id = p_booking_id;
    
    -- Delete related review requests
    DELETE FROM public.review_requests WHERE review_requests.booking_id = p_booking_id;
    
    -- Delete related feedback
    DELETE FROM public.feedback WHERE feedback.booking_id = p_booking_id;
    
    -- Delete the booking itself
    DELETE FROM public.bookings WHERE bookings.id = p_booking_id;
    
    -- Update room status to available
    IF v_room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET status = 'available' 
      WHERE id = v_room_id;
    END IF;

    v_result := json_build_object(
      'success', true,
      'message', 'Hotel booking and all related data deleted successfully',
      'room_id', v_room_id
    );

  -- Handle conference booking deletion
  ELSIF p_booking_type = 'conference' THEN
    -- Get conference_room_id before deleting
    SELECT cb.conference_room_id INTO v_conference_room_id
    FROM public.conference_bookings cb
    WHERE cb.id = p_booking_id;
    
    IF v_conference_room_id IS NULL THEN
      RAISE EXCEPTION 'Conference booking not found';
    END IF;

    -- Delete related payments first
    DELETE FROM public.payments WHERE payments.conference_booking_id = p_booking_id;
    
    -- Delete the conference booking itself
    DELETE FROM public.conference_bookings WHERE conference_bookings.id = p_booking_id;
    
    -- Update conference room status to available
    IF v_conference_room_id IS NOT NULL THEN
      UPDATE public.conference_rooms 
      SET status = 'available' 
      WHERE id = v_conference_room_id;
    END IF;

    v_result := json_build_object(
      'success', true,
      'message', 'Conference booking and all related data deleted successfully',
      'conference_room_id', v_conference_room_id
    );

  ELSE
    RAISE EXCEPTION 'Invalid booking type: %', p_booking_type;
  END IF;

  RETURN v_result;
END;
$$;













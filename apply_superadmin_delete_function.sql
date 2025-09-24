-- Run this SQL in your Supabase SQL Editor to enable SuperAdmin booking deletion

-- Create RPC function for SuperAdmin booking deletion with complete data cleanup
CREATE OR REPLACE FUNCTION public.delete_booking_as_superadmin(
  booking_id integer,
  booking_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  room_id integer;
  conference_room_id integer;
  result json;
BEGIN
  -- Only SuperAdmins can call this function
  IF public.get_current_user_role() != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: SuperAdmin role required';
  END IF;

  -- Handle hotel booking deletion
  IF booking_type = 'hotel' THEN
    -- Get room_id before deleting
    SELECT b.room_id INTO room_id
    FROM public.bookings b
    WHERE b.id = booking_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Delete related payments first
    DELETE FROM public.payments WHERE booking_id = booking_id;
    
    -- Delete related review requests
    DELETE FROM public.review_requests WHERE booking_id = booking_id;
    
    -- Delete related feedback
    DELETE FROM public.feedback WHERE booking_id = booking_id;
    
    -- Delete the booking itself
    DELETE FROM public.bookings WHERE id = booking_id;
    
    -- Update room status to available
    IF room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET status = 'available' 
      WHERE id = room_id;
    END IF;

    result := json_build_object(
      'success', true,
      'message', 'Hotel booking and all related data deleted successfully',
      'room_id', room_id
    );

  -- Handle conference booking deletion
  ELSIF booking_type = 'conference' THEN
    -- Get conference_room_id before deleting
    SELECT cb.conference_room_id INTO conference_room_id
    FROM public.conference_bookings cb
    WHERE cb.id = booking_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conference booking not found';
    END IF;

    -- Delete related payments first
    DELETE FROM public.payments WHERE conference_booking_id = booking_id;
    
    -- Delete the conference booking itself
    DELETE FROM public.conference_bookings WHERE id = booking_id;
    
    -- Update conference room status to available
    IF conference_room_id IS NOT NULL THEN
      UPDATE public.conference_rooms 
      SET status = 'available' 
      WHERE id = conference_room_id;
    END IF;

    result := json_build_object(
      'success', true,
      'message', 'Conference booking and all related data deleted successfully',
      'conference_room_id', conference_room_id
    );

  ELSE
    RAISE EXCEPTION 'Invalid booking type: %', booking_type;
  END IF;

  RETURN result;
END;
$$;






-- COPY AND PASTE THIS ENTIRE CODE INTO YOUR SUPABASE SQL EDITOR
-- This will create a function that SuperAdmins can use to permanently delete bookings

-- Create the delete function
CREATE OR REPLACE FUNCTION delete_booking_permanently(
    p_booking_id integer,
    p_booking_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_id integer;
    v_conference_room_id integer;
    v_result json;
BEGIN
    -- Check if user has SuperAdmin role
    IF get_current_user_role() != 'SuperAdmin'::app_role THEN
        RAISE EXCEPTION 'Access denied: Only SuperAdmin can delete bookings';
    END IF;

    IF p_booking_type = 'hotel' THEN
        -- Get room_id before deleting
        SELECT room_id INTO v_room_id 
        FROM bookings 
        WHERE id = p_booking_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Hotel booking not found';
        END IF;
        
        -- Delete related data first (to avoid foreign key constraints)
        DELETE FROM payments WHERE booking_id = p_booking_id;
        DELETE FROM review_requests WHERE booking_id = p_booking_id;
        DELETE FROM feedback WHERE booking_id = p_booking_id;
        
        -- Delete the booking itself
        DELETE FROM bookings WHERE id = p_booking_id;
        
        -- Update room status to available
        UPDATE rooms SET status = 'available' WHERE id = v_room_id;
        
        v_result := json_build_object(
            'success', true,
            'message', 'Hotel booking permanently deleted',
            'room_id', v_room_id
        );
        
    ELSIF p_booking_type = 'conference' THEN
        -- Get conference_room_id before deleting
        SELECT conference_room_id INTO v_conference_room_id 
        FROM conference_bookings 
        WHERE id = p_booking_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Conference booking not found';
        END IF;
        
        -- Delete related data first
        DELETE FROM payments WHERE conference_booking_id = p_booking_id;
        
        -- Delete the conference booking itself
        DELETE FROM conference_bookings WHERE id = p_booking_id;
        
        -- Update conference room status to available
        UPDATE conference_rooms SET status = 'available' WHERE id = v_conference_room_id;
        
        v_result := json_build_object(
            'success', true,
            'message', 'Conference booking permanently deleted',
            'conference_room_id', v_conference_room_id
        );
        
    ELSE
        RAISE EXCEPTION 'Invalid booking type: %', p_booking_type;
    END IF;
    
    RETURN v_result;
END;
$$;







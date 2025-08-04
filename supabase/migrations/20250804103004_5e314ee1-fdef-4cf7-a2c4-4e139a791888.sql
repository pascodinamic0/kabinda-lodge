-- Step 1: Improve error handling for the get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    -- Log security event for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('unauthenticated_access', jsonb_build_object(
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- If user not found in users table, log and return default
  IF user_role IS NULL THEN
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('user_role_missing', jsonb_build_object(
      'user_id', auth.uid(),
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as default role for authenticated users not in users table
    RETURN 'Guest'::app_role;
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('role_function_error', jsonb_build_object(
      'user_id', auth.uid(),
      'error_message', SQLERRM,
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as fallback
    RETURN 'Guest'::app_role;
END;
$$;

-- Step 2: Create triggers to update room status when bookings are confirmed
CREATE OR REPLACE FUNCTION public.update_room_status_on_booking_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking status changes to 'confirmed', update room status if booking is active
  IF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Check if booking covers current date and room is not manually overridden
    IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      UPDATE rooms 
      SET status = 'occupied' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  -- When booking status changes from 'confirmed' to other statuses, check if room should be available
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
    -- Check if there are no other confirmed bookings for this room on current date
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = NEW.room_id 
      AND status = 'confirmed'
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
      AND id != NEW.id
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for booking confirmations
DROP TRIGGER IF EXISTS trigger_update_room_status_on_booking_confirmation ON bookings;
CREATE TRIGGER trigger_update_room_status_on_booking_confirmation
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_on_booking_confirmation();

-- Step 3: Enable realtime for payments table
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Step 4: Create an enhanced payment verification logging function
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
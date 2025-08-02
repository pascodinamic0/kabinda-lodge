-- Add manual override columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN manual_override boolean NOT NULL DEFAULT false,
ADD COLUMN override_reason text,
ADD COLUMN override_set_at timestamp with time zone,
ADD COLUMN override_set_by uuid;

-- Update the check_expired_bookings function to respect manual override
CREATE OR REPLACE FUNCTION public.check_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Update rooms to available when their bookings have expired (checkout date has passed)
  -- BUT only if manual_override is false
  UPDATE rooms 
  SET status = 'available' 
  WHERE id IN (
    SELECT DISTINCT r.id 
    FROM rooms r
    WHERE r.status = 'occupied'
    AND r.manual_override = false  -- Only update if not manually overridden
    AND NOT EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.room_id = r.id 
      AND b.status = 'booked' 
      AND b.start_date <= CURRENT_DATE 
      AND b.end_date >= CURRENT_DATE
    )
  );
  
  -- Update rooms to occupied for bookings that should start today
  -- BUT only if manual_override is false
  UPDATE rooms 
  SET status = 'occupied'
  WHERE id IN (
    SELECT DISTINCT b.room_id
    FROM bookings b
    WHERE b.status = 'booked'
    AND b.start_date <= CURRENT_DATE
    AND b.end_date >= CURRENT_DATE
    AND EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = b.room_id 
      AND r.status = 'available'
      AND r.manual_override = false  -- Only update if not manually overridden
    )
  );
END;
$function$;

-- Update the update_room_status_on_booking function to respect manual override
CREATE OR REPLACE FUNCTION public.update_room_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- When a new booking is created with 'booked' status
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    -- Set room to occupied if the booking is active (covers current date)
    -- BUT only if manual_override is false
    IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      UPDATE rooms 
      SET status = 'occupied' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  -- When a booking is updated to cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active bookings for this room
    -- AND only update if manual_override is false
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = NEW.room_id 
      AND status = 'booked' 
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
      AND id != NEW.id
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  -- When a booking is deleted
  IF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Check if there are any other active bookings for this room
    -- AND only update if manual_override is false
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = OLD.room_id 
      AND status = 'booked' 
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = OLD.room_id AND manual_override = false;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add function to manage room overrides
CREATE OR REPLACE FUNCTION public.set_room_override(
  p_room_id integer,
  p_override boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if user is admin
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  IF current_user_role != 'Admin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only administrators can set room overrides';
  END IF;
  
  -- Update room override status
  UPDATE public.rooms 
  SET 
    manual_override = p_override,
    override_reason = CASE WHEN p_override THEN p_reason ELSE NULL END,
    override_set_at = CASE WHEN p_override THEN now() ELSE NULL END,
    override_set_by = CASE WHEN p_override THEN auth.uid() ELSE NULL END
  WHERE id = p_room_id;
  
  -- Log the override change
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'room_override_change', 
    auth.uid(), 
    jsonb_build_object(
      'room_id', p_room_id,
      'override_enabled', p_override,
      'reason', p_reason
    )
  );
END;
$function$;
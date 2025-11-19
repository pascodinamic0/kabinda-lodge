-- Update booking expiration to 9:30 AM and create helper functions
-- This migration ensures all booking expiration logic respects 9:30 AM checkout time

-- Helper function to check if a booking is currently active (considering 9:30 AM expiration)
CREATE OR REPLACE FUNCTION public.is_booking_active(
  p_start_date date,
  p_end_date date,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  local_date date;
  local_time time;
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  -- Check if status is active
  IF p_status IS NULL OR NOT (p_status = ANY(active_statuses)) THEN
    RETURN false;
  END IF;

  -- Compute lodge local date/time
  local_date := (now() AT TIME ZONE 'Africa/Lubumbashi')::date;
  local_time := (now() AT TIME ZONE 'Africa/Lubumbashi')::time;

  -- Booking must have started
  IF p_start_date > local_date THEN
    RETURN false;
  END IF;

  -- Check if booking has ended based on 9:30 AM expiration
  IF p_end_date < local_date THEN
    -- Ended on a previous day
    RETURN false;
  ELSIF p_end_date = local_date THEN
    -- Ends today - check if it's after 9:30 AM
    IF local_time >= TIME '09:30' THEN
      RETURN false;
    ELSE
      RETURN true;
    END IF;
  ELSE
    -- Ends in the future
    RETURN true;
  END IF;
END;
$function$;

-- Update the check_expired_bookings function to use the helper logic
CREATE OR REPLACE FUNCTION public.check_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  local_date date;
  local_time time;
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  -- Compute lodge local date/time
  local_date := (now() AT TIME ZONE 'Africa/Lubumbashi')::date;
  local_time := (now() AT TIME ZONE 'Africa/Lubumbashi')::time;

  -- Release rooms where bookings have expired (after 9:30 AM on checkout day)
  UPDATE rooms 
  SET status = 'available' 
  WHERE id IN (
    SELECT DISTINCT r.id 
    FROM rooms r
    WHERE r.status = 'occupied'
      AND r.manual_override = false
      AND NOT EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.room_id = r.id 
          AND b.status = ANY(active_statuses)
          AND public.is_booking_active(b.start_date, b.end_date, b.status)
      )
  );

  -- Mark rooms occupied for active bookings (respecting manual override and 9:30 AM expiration)
  UPDATE rooms 
  SET status = 'occupied'
  WHERE id IN (
    SELECT DISTINCT b.room_id
    FROM bookings b
    WHERE b.status = ANY(active_statuses)
      AND public.is_booking_active(b.start_date, b.end_date, b.status)
      AND EXISTS (
        SELECT 1 FROM rooms r 
        WHERE r.id = b.room_id 
          AND r.status = 'available'
          AND r.manual_override = false
      )
  );
END;
$function$;

-- Update the trigger function to respect 9:30 AM expiration
CREATE OR REPLACE FUNCTION public.update_room_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  -- When a new booking is created with active status
  IF TG_OP = 'INSERT' AND NEW.status = ANY(active_statuses) THEN
    IF public.is_booking_active(NEW.start_date, NEW.end_date, NEW.status) THEN
      UPDATE rooms 
      SET status = 'occupied' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  -- When a booking is updated
  IF TG_OP = 'UPDATE' THEN
    -- Booking status changed to active
    IF NEW.status = ANY(active_statuses) AND NOT (OLD.status = ANY(active_statuses)) THEN
      IF public.is_booking_active(NEW.start_date, NEW.end_date, NEW.status) THEN
        UPDATE rooms 
        SET status = 'occupied' 
        WHERE id = NEW.room_id AND manual_override = false;
      END IF;
    -- Booking status changed from active to inactive
    ELSIF OLD.status = ANY(active_statuses) AND NOT (NEW.status = ANY(active_statuses)) THEN
      -- Check if there are any other active bookings for this room
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE room_id = NEW.room_id 
          AND status = ANY(active_statuses)
          AND id != NEW.id
          AND public.is_booking_active(start_date, end_date, status)
      ) THEN
        UPDATE rooms 
        SET status = 'available' 
        WHERE id = NEW.room_id AND manual_override = false;
      END IF;
    -- Booking dates or status changed but still active - recheck
    ELSIF NEW.status = ANY(active_statuses) AND (
      OLD.start_date != NEW.start_date OR 
      OLD.end_date != NEW.end_date OR
      OLD.status != NEW.status
    ) THEN
      -- Re-evaluate room status based on all active bookings
      IF public.is_booking_active(NEW.start_date, NEW.end_date, NEW.status) THEN
        UPDATE rooms 
        SET status = 'occupied' 
        WHERE id = NEW.room_id AND manual_override = false;
      ELSE
        -- This booking is no longer active, check if other bookings exist
        IF NOT EXISTS (
          SELECT 1 FROM bookings 
          WHERE room_id = NEW.room_id 
            AND status = ANY(active_statuses)
            AND id != NEW.id
            AND public.is_booking_active(start_date, end_date, status)
        ) THEN
          UPDATE rooms 
          SET status = 'available' 
          WHERE id = NEW.room_id AND manual_override = false;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- When a booking is deleted
  IF TG_OP = 'DELETE' AND OLD.status = ANY(active_statuses) THEN
    -- Check if there are any other active bookings for this room
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = OLD.room_id 
        AND status = ANY(active_statuses)
        AND public.is_booking_active(start_date, end_date, status)
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = OLD.room_id AND manual_override = false;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update cron job to run more frequently around 9:30 AM
-- Remove existing cron job if it exists
SELECT cron.unschedule('cleanup-expired-bookings') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-bookings'
);

-- Schedule cleanup to run every 15 minutes to catch the 9:30 AM expiration accurately
SELECT cron.schedule(
  'cleanup-expired-bookings',
  '*/15 * * * *', -- every 15 minutes
  'SELECT public.check_expired_bookings();'
);

-- Also schedule a specific run at 9:30 AM daily for immediate expiration
SELECT cron.schedule(
  'cleanup-expired-bookings-930am',
  '30 9 * * *', -- 9:30 AM daily in server time (adjust timezone if needed)
  'SELECT public.check_expired_bookings();'
);

-- Run the function immediately to update current room statuses
SELECT public.check_expired_bookings();


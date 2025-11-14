-- Enhanced room status management system
-- This will automatically manage room availability based on booking dates

-- Drop existing function and recreate with enhanced logic
DROP FUNCTION IF EXISTS public.update_room_status_on_booking();

CREATE OR REPLACE FUNCTION public.update_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new booking is created with 'booked' status
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    -- Set room to occupied if the booking is active (covers current date)
    IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      UPDATE rooms 
      SET status = 'occupied' 
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  -- When a booking is updated to cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active bookings for this room
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
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  -- When a booking is deleted
  IF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Check if there are any other active bookings for this room
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = OLD.room_id 
      AND status = 'booked' 
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = OLD.room_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to check and update expired bookings
DROP FUNCTION IF EXISTS public.check_expired_bookings();

CREATE OR REPLACE FUNCTION public.check_expired_bookings()
RETURNS void AS $$
BEGIN
  -- Update rooms to available when their bookings have expired (checkout date has passed)
  UPDATE rooms 
  SET status = 'available' 
  WHERE id IN (
    SELECT DISTINCT r.id 
    FROM rooms r
    WHERE r.status = 'occupied'
    AND NOT EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.room_id = r.id 
      AND b.status = 'booked' 
      AND b.start_date <= CURRENT_DATE 
      AND b.end_date >= CURRENT_DATE
    )
  );
  
  -- Update rooms to occupied for bookings that should start today
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
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS booking_room_status_trigger ON bookings;

CREATE TRIGGER booking_room_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_room_status_on_booking();

-- Set up automatic cleanup: rooms become available after checkout
-- This function will be called by cron to check for expired bookings
CREATE OR REPLACE FUNCTION public.cleanup_expired_bookings()
RETURNS void AS $$
BEGIN
  -- Log the cleanup operation
  INSERT INTO security_audit_log (event_type, event_details)
  VALUES ('room_status_cleanup', jsonb_build_object(
    'timestamp', now(),
    'action', 'automated_cleanup'
  ));
  
  -- Call the main cleanup function
  PERFORM check_expired_bookings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial cleanup to set correct room statuses based on existing bookings
SELECT check_expired_bookings();
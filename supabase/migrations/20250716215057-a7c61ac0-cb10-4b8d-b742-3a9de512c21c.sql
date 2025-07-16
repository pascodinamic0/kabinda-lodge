-- Create function to update room status based on bookings
CREATE OR REPLACE FUNCTION update_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new booking is created, set room to occupied
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    UPDATE rooms 
    SET status = 'occupied' 
    WHERE id = NEW.room_id;
  END IF;
  
  -- When a booking is updated to cancelled, check if room should be available
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active bookings for this room
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = NEW.room_id 
      AND status = 'booked' 
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
    ) THEN
      UPDATE rooms 
      SET status = 'available' 
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  -- When a booking is deleted, check if room should be available
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

-- Create triggers for automatic room status updates
DROP TRIGGER IF EXISTS booking_room_status_trigger ON bookings;
CREATE TRIGGER booking_room_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_on_booking();

-- Create function to automatically update room status based on checkout dates
CREATE OR REPLACE FUNCTION check_expired_bookings()
RETURNS void AS $$
BEGIN
  -- Set rooms to available when bookings have ended
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
END;
$$ LANGUAGE plpgsql;

-- Update existing room statuses to only use available/occupied
UPDATE rooms 
SET status = 'available' 
WHERE status NOT IN ('available', 'occupied');

-- Update any currently occupied rooms based on existing bookings
UPDATE rooms 
SET status = 'occupied' 
WHERE id IN (
  SELECT DISTINCT room_id 
  FROM bookings 
  WHERE status = 'booked' 
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE
);
-- Create function to update conference room status when booking status changes
CREATE OR REPLACE FUNCTION update_conference_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a conference booking is cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active bookings for this conference room at the same time
    IF NOT EXISTS (
      SELECT 1 FROM conference_bookings 
      WHERE conference_room_id = NEW.conference_room_id 
      AND status = 'booked' 
      AND id != NEW.id
      AND (
        (start_datetime <= NEW.start_datetime AND end_datetime > NEW.start_datetime) OR
        (start_datetime < NEW.end_datetime AND end_datetime >= NEW.end_datetime) OR
        (start_datetime >= NEW.start_datetime AND end_datetime <= NEW.end_datetime)
      )
    ) THEN
      UPDATE conference_rooms 
      SET status = 'available' 
      WHERE id = NEW.conference_room_id;
    END IF;
  END IF;
  
  -- When a conference booking is created with 'booked' status
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    -- Set conference room to occupied if the booking covers current time
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
      UPDATE conference_rooms 
      SET status = 'occupied' 
      WHERE id = NEW.conference_room_id;
    END IF;
  END IF;
  
  -- When a conference booking is deleted
  IF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Check if there are any other active bookings for this conference room
    IF NOT EXISTS (
      SELECT 1 FROM conference_bookings 
      WHERE conference_room_id = OLD.conference_room_id 
      AND status = 'booked' 
      AND (
        (start_datetime <= OLD.start_datetime AND end_datetime > OLD.start_datetime) OR
        (start_datetime < OLD.end_datetime AND end_datetime >= OLD.end_datetime) OR
        (start_datetime >= OLD.start_datetime AND end_datetime <= OLD.end_datetime)
      )
    ) THEN
      UPDATE conference_rooms 
      SET status = 'available' 
      WHERE id = OLD.conference_room_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function to update restaurant table status when reservation status changes
CREATE OR REPLACE FUNCTION update_restaurant_table_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a dining reservation is cancelled
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active reservations for this table on the same date/time
    IF NEW.table_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM dining_reservations 
      WHERE table_id = NEW.table_id 
      AND status NOT IN ('cancelled', 'completed')
      AND id != NEW.id
      AND reservation_date = NEW.reservation_date
      -- Assuming 2-hour time slots for table reservations
      AND ABS(EXTRACT(EPOCH FROM (reservation_time::time - NEW.reservation_time::time))/3600) < 2
    ) THEN
      UPDATE restaurant_tables 
      SET status = 'available' 
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  -- When a dining reservation is confirmed
  IF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Set table to occupied if reservation is for today and within time range
    IF NEW.table_id IS NOT NULL 
       AND NEW.reservation_date = CURRENT_DATE 
       AND NEW.reservation_time::time <= (CURRENT_TIME + INTERVAL '2 hours')
       AND NEW.reservation_time::time >= (CURRENT_TIME - INTERVAL '1 hour') THEN
      UPDATE restaurant_tables 
      SET status = 'occupied' 
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  -- When a dining reservation is deleted
  IF TG_OP = 'DELETE' AND OLD.table_id IS NOT NULL AND OLD.status NOT IN ('cancelled', 'completed') THEN
    -- Check if there are any other active reservations for this table
    IF NOT EXISTS (
      SELECT 1 FROM dining_reservations 
      WHERE table_id = OLD.table_id 
      AND status NOT IN ('cancelled', 'completed')
      AND reservation_date = OLD.reservation_date
      AND ABS(EXTRACT(EPOCH FROM (reservation_time::time - OLD.reservation_time::time))/3600) < 2
    ) THEN
      UPDATE restaurant_tables 
      SET status = 'available' 
      WHERE id = OLD.table_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for conference bookings
DROP TRIGGER IF EXISTS conference_booking_status_trigger ON conference_bookings;
CREATE TRIGGER conference_booking_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON conference_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_conference_room_status_on_booking();

-- Create triggers for dining reservations  
DROP TRIGGER IF EXISTS dining_reservation_status_trigger ON dining_reservations;
CREATE TRIGGER dining_reservation_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON dining_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_table_status_on_reservation();
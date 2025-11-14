-- Ensure room status sync includes confirmed and pending-verification hotel bookings
CREATE OR REPLACE FUNCTION public.check_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  UPDATE rooms 
  SET status = 'available' 
  WHERE id IN (
    SELECT r.id 
    FROM rooms r
    WHERE r.status = 'occupied'
      AND r.manual_override = false
      AND NOT EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.room_id = r.id 
          AND b.status = ANY(active_statuses)
          AND b.start_date <= CURRENT_DATE 
          AND b.end_date >= CURRENT_DATE
      )
  );
  
  UPDATE rooms 
  SET status = 'occupied'
  WHERE id IN (
    SELECT DISTINCT b.room_id
    FROM bookings b
    WHERE b.status = ANY(active_statuses)
      AND b.start_date <= CURRENT_DATE
      AND b.end_date >= CURRENT_DATE
      AND EXISTS (
        SELECT 1 FROM rooms r 
        WHERE r.id = b.room_id 
          AND r.status = 'available'
          AND r.manual_override = false
      )
  );
END;
$function$;

-- Keep rooms in sync when booking statuses change
CREATE OR REPLACE FUNCTION public.update_room_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = ANY(active_statuses) THEN
    IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      UPDATE rooms 
      SET status = 'occupied' 
      WHERE id = NEW.room_id AND manual_override = false;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = ANY(active_statuses) AND NOT (OLD.status = ANY(active_statuses)) THEN
      IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
        UPDATE rooms 
        SET status = 'occupied' 
        WHERE id = NEW.room_id AND manual_override = false;
      END IF;
    ELSIF OLD.status = ANY(active_statuses) AND NOT (NEW.status = ANY(active_statuses)) THEN
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE room_id = NEW.room_id 
          AND status = ANY(active_statuses)
          AND id != NEW.id
          AND start_date <= CURRENT_DATE 
          AND end_date >= CURRENT_DATE
      ) THEN
        UPDATE rooms 
        SET status = 'available' 
        WHERE id = NEW.room_id AND manual_override = false;
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' AND OLD.status = ANY(active_statuses) THEN
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE room_id = OLD.room_id 
        AND status = ANY(active_statuses)
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

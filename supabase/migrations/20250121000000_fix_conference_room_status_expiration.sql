-- Fix conference room status to automatically update when bookings expire
-- This addresses the issue where conference rooms remain "occupied" after bookings end

-- Update check_expired_bookings function to also handle conference rooms
CREATE OR REPLACE FUNCTION public.check_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
BEGIN
  -- Update hotel rooms (existing logic)
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

  -- Update conference rooms: set to available if no active bookings
  UPDATE conference_rooms 
  SET status = 'available' 
  WHERE id IN (
    SELECT cr.id 
    FROM conference_rooms cr
    WHERE cr.status = 'occupied'
      AND NOT EXISTS (
        SELECT 1 FROM conference_bookings cb 
        WHERE cb.conference_room_id = cr.id 
          AND cb.status = 'booked'
          AND cb.start_datetime <= NOW()
          AND cb.end_datetime >= NOW()
      )
  );
  
  -- Update conference rooms: set to occupied if there are active bookings
  UPDATE conference_rooms 
  SET status = 'occupied'
  WHERE id IN (
    SELECT DISTINCT cb.conference_room_id
    FROM conference_bookings cb
    WHERE cb.status = 'booked'
      AND cb.start_datetime <= NOW()
      AND cb.end_datetime >= NOW()
      AND EXISTS (
        SELECT 1 FROM conference_rooms cr 
        WHERE cr.id = cb.conference_room_id 
          AND cr.status = 'available'
      )
  );
END;
$function$;

-- Update the conference room status trigger to also check on UPDATE
-- This ensures status updates when booking times change
CREATE OR REPLACE FUNCTION public.update_conference_room_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- When a conference booking is cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are any other active bookings for this conference room at the same time
    IF NOT EXISTS (
      SELECT 1 FROM conference_bookings 
      WHERE conference_room_id = NEW.conference_room_id 
      AND status = 'booked' 
      AND id != NEW.id
      AND start_datetime <= NOW()
      AND end_datetime >= NOW()
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
  
  -- When a conference booking is updated (e.g., time changes)
  IF TG_OP = 'UPDATE' AND NEW.status = 'booked' THEN
    -- If booking now covers current time, set to occupied
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
      UPDATE conference_rooms 
      SET status = 'occupied' 
      WHERE id = NEW.conference_room_id;
    -- If booking no longer covers current time, check if room should be available
    ELSIF NEW.end_datetime < NOW() OR NEW.start_datetime > NOW() THEN
      IF NOT EXISTS (
        SELECT 1 FROM conference_bookings 
        WHERE conference_room_id = NEW.conference_room_id 
        AND status = 'booked' 
        AND id != NEW.id
        AND start_datetime <= NOW()
        AND end_datetime >= NOW()
      ) THEN
        UPDATE conference_rooms 
        SET status = 'available' 
        WHERE id = NEW.conference_room_id;
      END IF;
    END IF;
  END IF;
  
  -- When a conference booking is deleted
  IF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Check if there are any other active bookings for this conference room
    IF NOT EXISTS (
      SELECT 1 FROM conference_bookings 
      WHERE conference_room_id = OLD.conference_room_id 
      AND status = 'booked' 
      AND start_datetime <= NOW()
      AND end_datetime >= NOW()
    ) THEN
      UPDATE conference_rooms 
      SET status = 'available' 
      WHERE id = OLD.conference_room_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Run the function immediately to fix any rooms that are incorrectly marked as occupied
SELECT public.check_expired_bookings();


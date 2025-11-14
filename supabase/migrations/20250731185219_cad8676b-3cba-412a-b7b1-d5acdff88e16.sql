-- Update database functions to include proper search_path security setting

-- 1. Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

-- 2. Update update_conference_room_status_on_booking function
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
$function$;

-- 3. Update update_restaurant_table_status_on_reservation function
CREATE OR REPLACE FUNCTION public.update_restaurant_table_status_on_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- 4. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Insert directly without worrying about RLS since this runs as SECURITY DEFINER
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'role' = 'Admin' THEN 'Admin'::app_role
      WHEN NEW.raw_user_meta_data ->> 'role' = 'RestaurantLead' THEN 'RestaurantLead'::app_role
      WHEN NEW.raw_user_meta_data ->> 'role' = 'Receptionist' THEN 'Receptionist'::app_role
      ELSE 'Guest'::app_role  -- Default role for client signups
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 6. Update update_room_status_on_booking function
CREATE OR REPLACE FUNCTION public.update_room_status_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- 7. Update check_expired_bookings function
CREATE OR REPLACE FUNCTION public.check_expired_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- 8. Update cleanup_expired_bookings function
CREATE OR REPLACE FUNCTION public.cleanup_expired_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;
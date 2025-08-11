-- Replace deny-all RLS policies for auth_rate_limit (Postgres does not support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "No direct select" ON public.auth_rate_limit;
DROP POLICY IF EXISTS "No direct insert" ON public.auth_rate_limit;
DROP POLICY IF EXISTS "No direct update" ON public.auth_rate_limit;
DROP POLICY IF EXISTS "No direct delete" ON public.auth_rate_limit;

CREATE POLICY "No direct select" ON public.auth_rate_limit
FOR SELECT USING (false);

CREATE POLICY "No direct insert" ON public.auth_rate_limit
FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct update" ON public.auth_rate_limit
FOR UPDATE USING (false);

CREATE POLICY "No direct delete" ON public.auth_rate_limit
FOR DELETE USING (false);

-- Ensure key functions have a fixed search_path (re-run, safe idempotent)
CREATE OR REPLACE FUNCTION public.validate_guest_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.guest_email IS NOT NULL AND length(trim(NEW.guest_email)) > 0 THEN
    IF NOT public.validate_email(NEW.guest_email) THEN
      RAISE EXCEPTION 'Invalid guest email format';
    END IF;
  END IF;

  IF NEW.guest_phone IS NOT NULL AND length(trim(NEW.guest_phone)) > 0 THEN
    IF NOT public.validate_phone(NEW.guest_phone) THEN
      RAISE EXCEPTION 'Invalid guest phone format';
    END IF;
  END IF;

  IF NEW.guest_name IS NOT NULL THEN
    NEW.guest_name := trim(NEW.guest_name);
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_room_status_on_booking_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;
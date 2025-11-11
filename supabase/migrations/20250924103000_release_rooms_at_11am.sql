-- Release rooms at 9:30 AM local time on checkout date and respect manual overrides

-- Update the check_expired_bookings function to use Africa/Lubumbashi local time
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

  -- After 9:30 AM local time on checkout day, treat bookings ending today as expired
  -- Before 9:30 AM, keep rooms occupied for bookings ending today
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
          AND b.start_date <= local_date 
          AND (
            (local_time < TIME '09:30' AND b.end_date >= local_date) -- before 9:30 AM, still consider today as active
            OR
            (local_time >= TIME '09:30' AND b.end_date > local_date) -- after 9:30 AM, only bookings ending after today keep it occupied
          )
      )
  );

  -- Mark rooms occupied for active bookings (respecting manual override and 9:30 AM expiration)
  UPDATE rooms 
  SET status = 'occupied'
  WHERE id IN (
    SELECT DISTINCT b.room_id
    FROM bookings b
    WHERE b.status = ANY(active_statuses)
      AND b.start_date <= local_date
      AND (
        (local_time < TIME '09:30' AND b.end_date >= local_date) -- before 9:30 AM, bookings ending today are active
        OR
        (local_time >= TIME '09:30' AND b.end_date > local_date) -- after 9:30 AM, only bookings ending after today are active
      )
      AND EXISTS (
        SELECT 1 FROM rooms r 
        WHERE r.id = b.room_id 
          AND r.status = 'available'
          AND r.manual_override = false
      )
  );
END;
$function$;

-- Immediate operational fix: make rooms 5 and 13 available now and prevent auto-revert
UPDATE public.rooms 
SET status = 'available', 
    manual_override = true,
    override_reason = COALESCE(override_reason, 'Reception override: guest left'),
    override_set_at = now()
WHERE id IN (5, 13);




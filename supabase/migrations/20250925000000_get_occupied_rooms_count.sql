-- RPC function to get count of occupied rooms based on active bookings
-- Uses the same logic as check_expired_bookings function (9:30 AM checkout time)
CREATE OR REPLACE FUNCTION public.get_occupied_rooms_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  local_date date;
  local_time time;
  active_statuses text[] := ARRAY['booked', 'confirmed', 'pending_verification'];
  occupied_count integer;
BEGIN
  -- Only Admins, Receptionists, and SuperAdmins may call this
  IF public.get_current_user_role() NOT IN ('Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  -- Compute lodge local date/time (Africa/Lubumbashi timezone)
  local_date := (now() AT TIME ZONE 'Africa/Lubumbashi')::date;
  local_time := (now() AT TIME ZONE 'Africa/Lubumbashi')::time;

  -- Count occupied rooms in two ways:
  -- 1. Rooms with active bookings (not manually overridden)
  -- 2. Rooms manually set to occupied (manual_override = true AND status = 'occupied')
  WITH active_booking_rooms AS (
    -- Rooms with active bookings (manual_override = false)
    SELECT DISTINCT b.room_id AS room_id
    FROM bookings b
    INNER JOIN rooms r ON r.id = b.room_id
    WHERE b.status = ANY(active_statuses)
      AND b.start_date <= local_date
      AND (
        (local_time < TIME '09:30' AND b.end_date >= local_date) -- before 9:30 AM, bookings ending today are active
        OR
        (local_time >= TIME '09:30' AND b.end_date > local_date) -- after 9:30 AM, only bookings ending after today are active
      )
      AND r.manual_override = false
  ),
  manually_occupied_rooms AS (
    -- Rooms manually set to occupied
    SELECT id AS room_id
    FROM rooms
    WHERE status = 'occupied'
      AND manual_override = true
  )
  SELECT COUNT(DISTINCT room_id) INTO occupied_count
  FROM (
    SELECT room_id FROM active_booking_rooms
    UNION
    SELECT room_id FROM manually_occupied_rooms
  ) AS all_occupied_rooms;

  RETURN COALESCE(occupied_count, 0);
END;
$$;


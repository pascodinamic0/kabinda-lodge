-- Update complete_data_reset function to also delete Guest users
CREATE OR REPLACE FUNCTION public.complete_data_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Security check: Only SuperAdmins can perform complete reset
  SELECT role INTO current_user_role FROM public.users WHERE id = auth.uid();
  
  IF current_user_role != 'SuperAdmin'::app_role THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can perform complete data reset';
  END IF;
  
  -- Log the reset operation
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'complete_data_reset_initiated', 
    auth.uid(), 
    jsonb_build_object(
      'timestamp', now(),
      'reset_type', 'complete_historical_data_and_guest_users'
    )
  );
  
  -- Delete all transactional data in correct order (respecting foreign keys)
  -- Using WHERE TRUE to satisfy DELETE clause requirements
  
  -- 1. Delete dependent records first
  DELETE FROM public.order_items WHERE TRUE;
  DELETE FROM public.order_status_history WHERE TRUE;
  DELETE FROM public.menu_images WHERE TRUE;
  DELETE FROM public.restaurant_images WHERE TRUE;
  DELETE FROM public.room_images WHERE TRUE;
  DELETE FROM public.conference_room_images WHERE TRUE;
  
  -- 2. Delete payment and feedback records
  DELETE FROM public.payments WHERE TRUE;
  DELETE FROM public.feedback WHERE TRUE;
  DELETE FROM public.restaurant_reviews WHERE TRUE;
  
  -- 3. Delete main transactional records
  DELETE FROM public.orders WHERE TRUE;
  DELETE FROM public.bookings WHERE TRUE;
  DELETE FROM public.conference_bookings WHERE TRUE;
  DELETE FROM public.dining_reservations WHERE TRUE;
  
  -- 4. Delete service and operational records
  DELETE FROM public.guest_service_requests WHERE TRUE;
  DELETE FROM public.housekeeping_tasks WHERE TRUE;
  DELETE FROM public.incidents WHERE TRUE;
  DELETE FROM public.review_requests WHERE TRUE;
  DELETE FROM public.user_notifications WHERE TRUE;
  
  -- 5. Delete Guest users (preserve Admin/Staff accounts)
  DELETE FROM public.users WHERE role = 'Guest'::app_role;
  
  -- 6. Reset all room statuses to available and clear overrides
  UPDATE public.rooms 
  SET 
    status = 'available',
    manual_override = false,
    override_reason = NULL,
    override_set_at = NULL,
    override_set_by = NULL
  WHERE TRUE;
    
  -- 7. Reset all restaurant table statuses to available
  UPDATE public.restaurant_tables 
  SET status = 'available'
  WHERE TRUE;
  
  -- 8. Reset all conference room statuses to available  
  UPDATE public.conference_rooms 
  SET status = 'available'
  WHERE TRUE;
  
  -- 9. Clean up any orphaned key cards
  UPDATE public.key_cards 
  SET 
    status = 'inactive',
    room_id = NULL,
    guest_id = NULL,
    issued_at = NULL,
    expires_at = NULL
  WHERE TRUE;
  
  -- Log successful completion
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'complete_data_reset_completed', 
    auth.uid(), 
    jsonb_build_object(
      'timestamp', now(),
      'status', 'success',
      'guest_users_deleted', true
    )
  );
  
END;
$function$;
-- Create a function to completely reset all historical data
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
      'reset_type', 'complete_historical_data'
    )
  );
  
  -- Delete all transactional data in correct order (respecting foreign keys)
  
  -- 1. Delete dependent records first
  DELETE FROM public.order_items;
  DELETE FROM public.order_status_history;
  DELETE FROM public.menu_images;
  DELETE FROM public.restaurant_images;
  DELETE FROM public.room_images;
  DELETE FROM public.conference_room_images;
  
  -- 2. Delete payment and feedback records
  DELETE FROM public.payments;
  DELETE FROM public.feedback;
  DELETE FROM public.restaurant_reviews;
  
  -- 3. Delete main transactional records
  DELETE FROM public.orders;
  DELETE FROM public.bookings;
  DELETE FROM public.conference_bookings;
  DELETE FROM public.dining_reservations;
  
  -- 4. Delete service and operational records
  DELETE FROM public.guest_service_requests;
  DELETE FROM public.housekeeping_tasks;
  DELETE FROM public.incidents;
  DELETE FROM public.review_requests;
  DELETE FROM public.user_notifications;
  
  -- 5. Reset all room statuses to available and clear overrides
  UPDATE public.rooms 
  SET 
    status = 'available',
    manual_override = false,
    override_reason = NULL,
    override_set_at = NULL,
    override_set_by = NULL;
    
  -- 6. Reset all restaurant table statuses to available
  UPDATE public.restaurant_tables 
  SET status = 'available';
  
  -- 7. Reset all conference room statuses to available
  UPDATE public.conference_rooms 
  SET status = 'available';
  
  -- 8. Clean up any orphaned key cards
  UPDATE public.key_cards 
  SET 
    status = 'inactive',
    room_id = NULL,
    guest_id = NULL,
    issued_at = NULL,
    expires_at = NULL;
  
  -- Log successful completion
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'complete_data_reset_completed', 
    auth.uid(), 
    jsonb_build_object(
      'timestamp', now(),
      'status', 'success'
    )
  );
  
END;
$function$;
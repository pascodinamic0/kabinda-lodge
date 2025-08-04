-- Fix RLS policies for booking payment flow
-- Issue: Guests cannot create payment records for their bookings

-- 1. Add RLS policy for Guests to create payments for their own bookings
CREATE POLICY "Guests can create payments for their bookings" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- 2. Add RLS policy for Guests to view their own payments
CREATE POLICY "Guests can view their own payments" 
ON public.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- 3. Fix the get_current_user_role function to handle edge cases better
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    -- Log security event for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('unauthenticated_access', jsonb_build_object(
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role with explicit error handling
  BEGIN
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the specific error
      INSERT INTO public.security_audit_log (event_type, event_details)
      VALUES ('role_query_error', jsonb_build_object(
        'user_id', auth.uid(),
        'error_message', SQLERRM,
        'timestamp', now(),
        'function', 'get_current_user_role'
      ));
      
      -- Return Guest as fallback
      RETURN 'Guest'::app_role;
  END;
  
  -- If user not found in users table, log and return default
  IF user_role IS NULL THEN
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('user_role_missing', jsonb_build_object(
      'user_id', auth.uid(),
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as default role for authenticated users not in users table
    RETURN 'Guest'::app_role;
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    INSERT INTO public.security_audit_log (event_type, event_details)
    VALUES ('role_function_error', jsonb_build_object(
      'user_id', auth.uid(),
      'error_message', SQLERRM,
      'timestamp', now(),
      'function', 'get_current_user_role'
    ));
    
    -- Return Guest as fallback
    RETURN 'Guest'::app_role;
END;
$$;

-- 4. Add audit logging for payment creation to debug issues
CREATE OR REPLACE FUNCTION public.log_payment_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, event_details)
  VALUES (
    'payment_created',
    auth.uid(),
    jsonb_build_object(
      'payment_id', NEW.id,
      'booking_id', NEW.booking_id,
      'amount', NEW.amount,
      'method', NEW.method,
      'status', NEW.status,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment creation logging
DROP TRIGGER IF EXISTS log_payment_creation_trigger ON public.payments;
CREATE TRIGGER log_payment_creation_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_creation();
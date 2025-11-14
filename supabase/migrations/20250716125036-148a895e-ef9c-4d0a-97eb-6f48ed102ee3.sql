-- Fix function search path security issues
ALTER FUNCTION public.get_current_user_role() 
SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_temp;
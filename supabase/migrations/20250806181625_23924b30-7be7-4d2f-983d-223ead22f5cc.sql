-- Phase 1: Create persistent notification tables

-- Create user_notifications table to track read/dismissed status
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_key TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_until TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user per notification key
  UNIQUE(user_id, notification_key)
);

-- Create notification_settings table for user preferences
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'immediate',
  quiet_hours_start TIME NULL,
  quiet_hours_end TIME NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can manage their own notifications" 
ON public.user_notifications 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all notifications for management" 
ON public.user_notifications 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]));

-- RLS policies for notification_settings
CREATE POLICY "Users can manage their own notification settings" 
ON public.notification_settings 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view notification settings for support" 
ON public.notification_settings 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]));

-- Create trigger for updating updated_at timestamps
CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate stable notification keys
CREATE OR REPLACE FUNCTION public.generate_notification_key(
  notification_type TEXT,
  related_id TEXT DEFAULT NULL,
  user_specific BOOLEAN DEFAULT false
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF user_specific AND related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSIF related_id IS NOT NULL THEN
    RETURN notification_type || '_' || related_id;
  ELSE
    RETURN notification_type;
  END IF;
END;
$$;
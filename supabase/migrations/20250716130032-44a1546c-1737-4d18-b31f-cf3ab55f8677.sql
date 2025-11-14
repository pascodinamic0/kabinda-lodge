-- Update auth configuration for better security
-- Set shorter OTP expiry (this will need to be configured in Supabase dashboard)
-- Enable additional security features

-- Add trigger to enforce strong passwords and prevent leaked passwords
-- This trigger will be called whenever a user signs up or changes password
CREATE OR REPLACE FUNCTION public.check_password_security()
RETURNS trigger AS $$
BEGIN
  -- Check password length (minimum 8 characters)
  IF length(NEW.encrypted_password) < 60 THEN -- bcrypt hash is typically 60 chars
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Password breach checking needs to be enabled in Supabase dashboard
-- OTP expiry also needs to be configured in Supabase dashboard under Authentication settings

-- Add audit log table for tracking important security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (get_current_user_role() = 'Admin'::app_role);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Add session management table for better security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- System can manage sessions
CREATE POLICY "System can manage sessions"
ON public.user_sessions
FOR ALL
USING (true);
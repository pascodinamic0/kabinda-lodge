-- Create application settings table
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category, key, user_id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" ON public.app_settings
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own settings" ON public.app_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON public.app_settings
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage all settings" ON public.app_settings
  FOR ALL USING (get_current_user_role() = 'Admin');

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.app_settings (category, key, value, description, user_id) VALUES
  ('system', 'hotel_name', '"Kabinda Lodge"', 'Hotel name displayed throughout the application', null),
  ('system', 'hotel_email', '"info@kabidalodge.com"', 'Main hotel contact email', null),
  ('system', 'hotel_phone', '"+1 (555) 123-4567"', 'Main hotel contact phone', null),
  ('system', 'hotel_address', '"123 Main Street, City, Country"', 'Hotel physical address', null),
  ('system', 'check_in_time', '"15:00"', 'Default check-in time', null),
  ('system', 'check_out_time', '"11:00"', 'Default check-out time', null),
  ('system', 'currency', '"USD"', 'Default currency for pricing', null),
  ('system', 'timezone', '"UTC"', 'Application timezone', null),
  ('notifications', 'email_enabled', 'true', 'Enable email notifications', null),
  ('notifications', 'push_enabled', 'true', 'Enable push notifications', null),
  ('integrations', 'stripe_enabled', 'false', 'Stripe payment gateway enabled', null),
  ('integrations', 'email_provider', '"sendgrid"', 'Email service provider', null);
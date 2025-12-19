// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthWebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
  old_record?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auth webhook received request');
    
    const payload: AuthWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle user signup confirmation
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.record) {
      const user = payload.record;
      console.log('New user signup detected:', user.email);
      
      // Initialize Supabase admin client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration');
      }
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Check if this is an OAuth signup (Google, etc.)
      const isOAuthSignup = user.app_metadata?.provider && user.app_metadata.provider !== 'email';
      
      if (isOAuthSignup) {
        console.log(`OAuth signup detected via ${user.app_metadata.provider}`);
        
        // Create user profile for OAuth users
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            phone: user.user_metadata?.phone || '',
            role: 'Guest',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('Error creating OAuth user profile:', profileError);
        } else {
          console.log('OAuth user profile created successfully');
        }
      } else {
        // Only send confirmation email if user is not confirmed yet and not OAuth
        if (!user.email_confirmed_at) {
          console.log('Sending confirmation email to:', user.email);
          
          // Create confirmation URL
          const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${user.confirmation_token}&type=signup&redirect_to=${encodeURIComponent(Deno.env.get('SITE_URL') || 'http://localhost:5173')}`;
          
          const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
          if (!supabaseAnonKey) {
            throw new Error('Missing Supabase anon key');
          }
          
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          const { data, error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'email-confirmation',
              to: user.email,
              data: {
                confirmation_url: confirmationUrl,
                user_email: user.email,
                user_id: user.id
              }
            }
          });

          if (error) {
            console.error('Error sending confirmation email:', error);
            throw error;
          }

          console.log('Confirmation email sent successfully to:', user.email);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in auth webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
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
      
      // Only send confirmation email if user is not confirmed yet
      if (!user.email_confirmed_at) {
        console.log('Sending confirmation email to:', user.email);
        
        // Create confirmation URL
        const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${user.confirmation_token}&type=signup&redirect_to=${encodeURIComponent(Deno.env.get('SITE_URL') || 'http://localhost:5173')}`;
        
        // Call our send-notification-email function
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing Supabase configuration');
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
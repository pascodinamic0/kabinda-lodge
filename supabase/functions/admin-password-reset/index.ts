import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  targetUserId: string;
  newPassword: string;
  reason?: string;
}

serve(async (req) => {
  console.log('Admin password reset function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Create admin client for user management
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { targetUserId, newPassword, reason }: PasswordResetRequest = await req.json();

    if (!targetUserId || !newPassword) {
      throw new Error('Target user ID and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    console.log('Processing password reset for user:', targetUserId);

    // Call the security function to validate permissions and log the attempt
    const { error: securityError } = await supabase.rpc('admin_reset_user_password', {
      target_user_id: targetUserId,
      new_password: newPassword,
      reason: reason || 'Admin password reset'
    });

    if (securityError) {
      console.error('Security validation failed:', securityError);
      throw securityError;
    }

    // Use the admin client to update the user's password
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (passwordError) {
      console.error('Password update failed:', passwordError);
      throw passwordError;
    }

    // Get user details for email notification
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', targetUserId)
      .single();

    if (!userError && targetUser) {
      // Send email notification
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'password-reset',
            to: targetUser.email,
            data: {
              userName: targetUser.name,
              userEmail: targetUser.email,
              newPassword: newPassword,
              reason: reason
            }
          }
        });
      } catch (emailError) {
        console.warn("Failed to send password reset email:", emailError);
        // Don't fail the password reset if email fails
      }
    }

    // Log successful password reset
    const { error: logError } = await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'admin_password_reset_completed',
        event_details: {
          target_user_id: targetUserId,
          reason: reason || 'Admin password reset',
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Failed to log password reset:', logError);
      // Don't throw here as the password reset succeeded
    }

    console.log('Password reset completed successfully for user:', targetUserId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin password reset:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
// Edge function to create Super Admin user
// This should be run once to create the initial Super Admin account

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the Super Admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'ekabilam@gmail.com',
      password: 'RICHARDE@15',
      user_metadata: {
        name: 'Super Administrator',
        role: 'SuperAdmin'
      },
      email_confirm: true // Skip email confirmation
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user', details: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the user record with the actual auth user ID
    if (authData.user) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', 'ekabilam@gmail.com')

      if (updateError) {
        console.error('Update error:', updateError)
        // Even if update fails, the auth user was created successfully
      }

      // Log the creation
      await supabaseAdmin
        .from('security_audit_log')
        .insert({
          event_type: 'super_admin_created',
          user_id: authData.user.id,
          event_details: {
            action: 'super_admin_auth_user_created',
            email: 'ekabilam@gmail.com',
            timestamp: new Date().toISOString()
          }
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super Admin user created successfully',
        user_id: authData.user?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
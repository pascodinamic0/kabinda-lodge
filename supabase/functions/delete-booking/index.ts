import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { booking_id, booking_type } = await req.json()

    if (!booking_id || !booking_type) {
      throw new Error('Missing booking_id or booking_type')
    }

    if (booking_type === 'hotel') {
      // Delete related payments first
      await supabaseClient
        .from('payments')
        .delete()
        .eq('booking_id', booking_id)

      // Delete related review requests
      await supabaseClient
        .from('review_requests')
        .delete()
        .eq('booking_id', booking_id)

      // Delete related feedback
      await supabaseClient
        .from('feedback')
        .delete()
        .eq('booking_id', booking_id)

      // Get room_id before deleting booking
      const { data: bookingData } = await supabaseClient
        .from('bookings')
        .select('room_id')
        .eq('id', booking_id)
        .single()

      // Delete the booking itself
      const { data: deleteData, error: deleteError } = await supabaseClient
        .from('bookings')
        .delete()
        .eq('id', booking_id)
        .select()

      if (deleteError) {
        throw deleteError
      }

      // Update room status to available
      if (bookingData?.room_id) {
        await supabaseClient
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', bookingData.room_id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Hotel booking deleted successfully',
          data: deleteData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else if (booking_type === 'conference') {
      // Delete related payments first
      await supabaseClient
        .from('payments')
        .delete()
        .eq('conference_booking_id', booking_id)

      // Get conference_room_id before deleting booking
      const { data: bookingData } = await supabaseClient
        .from('conference_bookings')
        .select('conference_room_id')
        .eq('id', booking_id)
        .single()

      // Delete the conference booking itself
      const { data: deleteData, error: deleteError } = await supabaseClient
        .from('conference_bookings')
        .delete()
        .eq('id', booking_id)
        .select()

      if (deleteError) {
        throw deleteError
      }

      // Update conference room status to available
      if (bookingData?.conference_room_id) {
        await supabaseClient
          .from('conference_rooms')
          .update({ status: 'available' })
          .eq('id', bookingData.conference_room_id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Conference booking deleted successfully',
          data: deleteData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else {
      throw new Error('Invalid booking type')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

/**
 * Card Issues API Routes
 * GET /api/card-issues - List card issues
 * POST /api/card-issues - Create new card issue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew';
  
  // Use service role key if available, otherwise fall back to anon key (with RLS)
  const key = supabaseServiceKey || supabaseAnonKey;
  
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// GET /api/card-issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel');
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // hotelId is required unless querying by agent
    if (!hotelId && !agentId) {
      return NextResponse.json(
        { error: 'hotel or agent parameter is required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();

    let query = serverSupabase
      .from('card_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (hotelId) {
      query = query.eq('hotel_id', hotelId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: cardIssues, error } = await query;

    if (error) {
      console.error('Error fetching card issues:', error);
      return NextResponse.json(
        { error: 'Failed to fetch card issues' },
        { status: 500 }
      );
    }

    return NextResponse.json({ cardIssues });
  } catch (error: any) {
    console.error('Error in GET /api/card-issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/card-issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, roomId, bookingId, cardType, payload, userId } = body;

    if (!hotelId || !cardType || !payload) {
      return NextResponse.json(
        { error: 'hotelId, cardType, and payload are required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();

    // Create card issue record
    const { data: cardIssue, error } = await serverSupabase
      .from('card_issues')
      .insert({
        hotel_id: hotelId,
        room_id: roomId,
        booking_id: bookingId,
        user_id: userId,
        card_type: cardType,
        payload,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating card issue:', error);
      return NextResponse.json(
        { error: 'Failed to create card issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ cardIssue });
  } catch (error: any) {
    console.error('Error in POST /api/card-issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


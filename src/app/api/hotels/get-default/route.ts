/**
 * GET /api/hotels/get-default
 * Get default hotel (uses service role key, bypasses RLS)
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

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();

    // Get first hotel (or hotel named 'Kabinda Lodge')
    const { data: hotel, error } = await serverSupabase
      .from('hotels')
      .select('id')
      .or('name.eq.Kabinda Lodge')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching hotel:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch hotel' },
        { status: 500 }
      );
    }

    if (!hotel) {
      return NextResponse.json(
        { error: 'No hotel found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hotelId: hotel.id });
  } catch (error: any) {
    console.error('Error in GET /api/hotels/get-default:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


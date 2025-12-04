/**
 * POST /api/hotels/create-default
 * Create default hotel (uses service role key, bypasses RLS)
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

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();

    // Check if hotel already exists
    const { data: existingHotel } = await serverSupabase
      .from('hotels')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingHotel) {
      return NextResponse.json({ hotelId: existingHotel.id });
    }

    // Create default hotel
    const { data: newHotel, error } = await serverSupabase
      .from('hotels')
      .insert({ name: 'Kabinda Lodge' })
      .select('id')
      .single();

    if (error || !newHotel) {
      console.error('Error creating hotel:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create hotel' },
        { status: 500 }
      );
    }

    return NextResponse.json({ hotelId: newHotel.id });
  } catch (error: any) {
    console.error('Error in POST /api/hotels/create-default:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


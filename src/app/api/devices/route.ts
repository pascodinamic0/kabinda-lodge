/**
 * Devices API Routes
 * GET /api/devices - List devices
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

// GET /api/devices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');
    const hotelId = searchParams.get('hotel');

    const serverSupabase = getServerSupabase();

    let query = serverSupabase
      .from('devices')
      .select('*')
      .order('last_used', { ascending: false });

    if (agentId) {
      query = query.eq('agent_id', agentId);
    } else if (hotelId) {
      // Get devices for all agents in this hotel
      const { data: agents } = await serverSupabase
        .from('agents')
        .select('id')
        .eq('hotel_id', hotelId);
      
      if (agents && agents.length > 0) {
        query = query.in('agent_id', agents.map(a => a.id));
      } else {
        return NextResponse.json({ devices: [] });
      }
    } else {
      return NextResponse.json(
        { error: 'agent or hotel parameter is required' },
        { status: 400 }
      );
    }

    const { data: devices, error } = await query;

    if (error) {
      console.error('Error fetching devices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch devices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error('Error in GET /api/devices:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


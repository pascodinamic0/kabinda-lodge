/**
 * POST /api/pairing/confirm
 * Confirm agent pairing using pairing token
 * Called by agent during pairing process
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew';
  
  // Use service role key if available, otherwise fall back to anon key (with RLS)
  // Note: For agent pairing, service role key is recommended but not required if RLS allows
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
    const body = await request.json();
    const { pairingToken, fingerprint, agentName, deviceInfo } = body;

    if (!pairingToken || !fingerprint || !agentName) {
      return NextResponse.json(
        { error: 'pairingToken, fingerprint, and agentName are required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();

    // Find and validate pairing token
    const { data: tokenData, error: tokenError } = await serverSupabase
      .from('pairing_tokens')
      .select('*')
      .eq('token', pairingToken)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid pairing token' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Pairing token has expired' },
        { status: 401 }
      );
    }

    // Check if token was already used
    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'Pairing token has already been used' },
        { status: 401 }
      );
    }

    // Check if agent with this fingerprint already exists
    const { data: existingAgent } = await serverSupabase
      .from('agents')
      .select('id')
      .eq('fingerprint', fingerprint)
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent with this fingerprint is already paired' },
        { status: 409 }
      );
    }

    // Generate agent token for authentication
    const agentToken = crypto.randomUUID();

    // Create agent record
    const { data: agent, error: agentError } = await serverSupabase
      .from('agents')
      .insert({
        hotel_id: tokenData.hotel_id,
        name: agentName,
        fingerprint,
        agent_token: agentToken, // In production, encrypt this
        paired_at: new Date().toISOString(),
        paired_by: tokenData.created_by,
        last_seen: new Date().toISOString(),
        status: 'online',
      })
      .select()
      .single();

    if (agentError) {
      console.error('Error creating agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    // Create device record if device info provided
    if (deviceInfo) {
      await serverSupabase
        .from('devices')
        .insert({
          agent_id: agent.id,
          model: deviceInfo.model || 'Unknown',
          serial: deviceInfo.serial,
          vendor: deviceInfo.vendor,
          connected: true,
        });
    }

    // Mark pairing token as used
    await serverSupabase
      .from('pairing_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return NextResponse.json({
      agentId: agent.id,
      agentToken,
      hotelId: tokenData.hotel_id,
    });
  } catch (error: any) {
    console.error('Error in pairing/confirm:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


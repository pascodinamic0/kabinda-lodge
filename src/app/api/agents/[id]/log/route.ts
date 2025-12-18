/**
 * POST /api/agents/:id/log
 * Log device events from agents
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: agentId } = params;
    const body = await request.json();
    const { eventType, payload, deviceId, cardIssueId } = body;

    if (!eventType || !payload) {
      return NextResponse.json(
        { error: 'eventType and payload are required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();

    // Verify agent exists
    const { data: agent, error: agentError } = await serverSupabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Create device log
    const { data: log, error } = await serverSupabase
      .from('device_logs')
      .insert({
        agent_id: agentId,
        device_id: deviceId,
        card_issue_id: cardIssueId,
        event_type: eventType,
        payload,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating device log:', error);
      return NextResponse.json(
        { error: 'Failed to create device log' },
        { status: 500 }
      );
    }

    // Update agent last_seen
    await serverSupabase
      .from('agents')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('id', agentId);

    return NextResponse.json({ log });
  } catch (error: any) {
    console.error('Error in POST /api/agents/:id/log:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/card-issues/:id/status
 * Update card issue status
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, result, error_message, agentId, deviceId } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (result) {
      updateData.result = result;
    }

    if (error_message) {
      updateData.error_message = error_message;
    }

    if (agentId) {
      updateData.agent_id = agentId;
    }

    if (deviceId) {
      updateData.device_id = deviceId;
    }

    if (status === 'done' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: cardIssue, error } = await serverSupabase
      .from('card_issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating card issue status:', error);
      return NextResponse.json(
        { error: 'Failed to update card issue status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ cardIssue });
  } catch (error: any) {
    console.error('Error in PATCH /api/card-issues/:id/status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


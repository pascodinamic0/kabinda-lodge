/**
 * Agents API Routes
 * GET /api/agents - List agents
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

// GET /api/agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel');
    const status = searchParams.get('status');

    if (!hotelId) {
      return NextResponse.json(
        { error: 'hotel parameter is required' },
        { status: 400 }
      );
    }

    const serverSupabase = getServerSupabase();
    
    // If no agents table exists yet, return empty array
    try {

      let query = serverSupabase
        .from('agents')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('last_seen', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: agents, error } = await query;

      if (error) {
        console.error('Error fetching agents:', error);
        // If RLS blocks access, return empty array instead of error (for development)
        if (error.message?.includes('row-level security') || error.message?.includes('permission denied') || error.message?.includes('relation') || error.code === 'PGRST116') {
          console.warn('RLS blocked agents query or table does not exist, returning empty array');
          return NextResponse.json({ agents: [] });
        }
        return NextResponse.json(
          { error: `Failed to fetch agents: ${error.message}` },
          { status: 500 }
        );
      }

      // Get queue length for each agent (pending card issues)
      // Handle errors gracefully - if card_issues table doesn't exist or query fails, just return agents without queue length
      const agentsWithQueue = await Promise.all(
        (agents || []).map(async (agent) => {
          try {
            const { count } = await serverSupabase
              .from('card_issues')
              .select('*', { count: 'exact', head: true })
              .eq('agent_id', agent.id)
              .in('status', ['pending', 'queued']);

            return {
              ...agent,
              queueLength: count || 0,
            };
          } catch (queueError: any) {
            // If queue query fails, just return agent without queue length
            console.warn('Could not get queue length for agent:', agent.id, queueError);
            return {
              ...agent,
              queueLength: 0,
            };
          }
        })
      );

      return NextResponse.json({ agents: agentsWithQueue });
    } catch (tableError: any) {
      // If agents table doesn't exist, return empty array
      console.warn('Agents table may not exist or query failed:', tableError);
      return NextResponse.json({ agents: [] });
    }
  } catch (error: any) {
    console.error('Error in GET /api/agents:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


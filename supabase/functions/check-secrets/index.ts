// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckSecretsRequest {
  secrets: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secrets }: CheckSecretsRequest = await req.json();
    
    const secretStatus: Record<string, boolean> = {};
    
    // Check each requested secret
    for (const secretName of secrets) {
      try {
        const secretValue = Deno.env.get(secretName);
        secretStatus[secretName] = !!(secretValue && secretValue.trim() !== '');
      } catch (error) {
        console.log(`Secret ${secretName} not found:`, error);
        secretStatus[secretName] = false;
      }
    }

    console.log('Secret status check:', secretStatus);

    return new Response(JSON.stringify({ secretStatus }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in check-secrets function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
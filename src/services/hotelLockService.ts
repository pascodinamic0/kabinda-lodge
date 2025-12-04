/**
 * Hotel Lock Service
 * Client-side service for interacting with hotel lock API
 */
import { supabase } from '@/integrations/supabase/client';
import type {
  Agent,
  Device,
  CardIssue,
  CreatePairingTokenRequest,
  CreatePairingTokenResponse,
  CreateCardIssueRequest,
  CreateCardIssueResponse,
  UpdateCardIssueStatusRequest,
  AgentStatusResponse,
} from '@/types/hotelLock';

const API_BASE = '/api';

/**
 * Get current user's session token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Create a pairing token for agent registration
 */
export async function createPairingToken(
  request: CreatePairingTokenRequest
): Promise<CreatePairingTokenResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/pairing/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create pairing token');
  }

  return response.json();
}

/**
 * Get list of agents for a hotel
 */
export async function getAgents(hotelId: string): Promise<Agent[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/agents?hotel=${hotelId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch agents');
  }

  const data = await response.json();
  return data.agents || [];
}

/**
 * Get devices for an agent or hotel
 */
export async function getDevices(agentId?: string, hotelId?: string): Promise<Device[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (agentId) params.append('agent', agentId);
  if (hotelId) params.append('hotel', hotelId);

  const response = await fetch(`${API_BASE}/devices?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch devices');
  }

  const data = await response.json();
  return data.devices || [];
}

/**
 * Create a card issue
 */
export async function createCardIssue(
  request: CreateCardIssueRequest
): Promise<CardIssue> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/card-issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      userId: (await supabase.auth.getUser()).data.user?.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create card issue');
  }

  const data: CreateCardIssueResponse = await response.json();
  return data.cardIssue;
}

/**
 * Get card issues for a hotel
 */
export async function getCardIssues(
  hotelId: string,
  options?: {
    status?: CardIssue['status'];
    agentId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CardIssue[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams({ hotel: hotelId });
  if (options?.status) params.append('status', options.status);
  if (options?.agentId) params.append('agent', options.agentId);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/card-issues?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch card issues');
  }

  const data = await response.json();
  return data.cardIssues || [];
}

/**
 * Update card issue status
 */
export async function updateCardIssueStatus(
  cardIssueId: string,
  update: UpdateCardIssueStatusRequest & { agentId?: string; deviceId?: string }
): Promise<CardIssue> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/card-issues/${cardIssueId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update card issue status');
  }

  const data = await response.json();
  return data.cardIssue;
}

/**
 * Call local agent to encode a card
 * This is called from the browser to the local agent running on localhost
 */
export async function callLocalAgent(
  endpoint: string,
  payload: any,
  agentPort: number = 8443
): Promise<any> {
  try {
    const response = await fetch(`https://localhost:${agentPort}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Note: In production, you'll need to handle self-signed certs
      // For development, browsers will show a warning
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Agent request failed');
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (agent not running, CORS, etc.)
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Local agent is not available. Please ensure the agent is running on this computer.');
    }
    throw error;
  }
}

/**
 * Encode card via local agent
 */
export async function encodeCardViaAgent(
  cardIssueId: string,
  cardPayload: any,
  hotelId: string,
  roomId?: string,
  agentPort: number = 8443
): Promise<{ ok: boolean; result?: any; error?: string }> {
  return callLocalAgent('/encode-card', {
    cardIssueId,
    cardPayload,
    hotelId,
    roomId,
  }, agentPort);
}

/**
 * Get local agent status
 */
export async function getLocalAgentStatus(agentPort: number = 8443): Promise<any> {
  try {
    const response = await fetch(`https://localhost:${agentPort}/status`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Agent status check failed');
    }

    return response.json();
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      return { connected: false, error: 'Agent not available' };
    }
    throw error;
  }
}





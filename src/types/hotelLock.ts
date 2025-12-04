/**
 * Hotel Lock Integration Types
 * Types for agents, devices, card issues, and related entities
 */

export interface Hotel {
  id: string;
  name: string;
  created_at: string;
}

export interface HotelUser {
  id: string;
  hotel_id: string;
  user_id: string;
  email?: string;
  name?: string;
  role: 'admin' | 'operator' | 'reception';
  created_at: string;
}

export interface Agent {
  id: string;
  hotel_id: string;
  name: string;
  fingerprint: string;
  agent_token?: string;
  paired_at?: string;
  paired_by?: string;
  last_seen?: string;
  status: 'online' | 'offline' | 'error';
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  agent_id: string;
  model: string;
  serial?: string;
  vendor?: string;
  connected: boolean;
  last_used?: string;
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HotelRoom {
  id: string;
  hotel_id: string;
  number: string;
  type?: string;
  created_at: string;
}

export interface PairingToken {
  id: string;
  hotel_id: string;
  token: string;
  agent_name?: string;
  created_by?: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface CardIssue {
  id: string;
  hotel_id: string;
  room_id?: string;
  booking_id?: string;
  user_id?: string;
  agent_id?: string;
  device_id?: string;
  status: 'pending' | 'in_progress' | 'done' | 'failed' | 'queued';
  card_type?: string;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DeviceLog {
  id: string;
  agent_id: string;
  device_id?: string;
  card_issue_id?: string;
  event_type: 'card_programmed' | 'card_read' | 'device_connected' | 'device_disconnected' | 'error' | string;
  payload: Record<string, any>;
  created_at: string;
}

// API Request/Response Types
export interface CreatePairingTokenRequest {
  agentName: string;
  hotelId: string;
}

export interface CreatePairingTokenResponse {
  pairingToken: string;
  expiresAt: string;
}

export interface ConfirmPairingRequest {
  pairingToken: string;
  fingerprint: string;
  agentName: string;
  deviceInfo?: {
    model?: string;
    serial?: string;
    vendor?: string;
  };
}

export interface ConfirmPairingResponse {
  agentId: string;
  agentToken: string;
  hotelId: string;
}

export interface CreateCardIssueRequest {
  hotelId: string;
  roomId?: string;
  bookingId?: string;
  cardType: string;
  payload: Record<string, any>;
}

export interface CreateCardIssueResponse {
  cardIssue: CardIssue;
}

export interface UpdateCardIssueStatusRequest {
  status: CardIssue['status'];
  result?: Record<string, any>;
  error_message?: string;
}

export interface AgentStatusResponse {
  agent: Agent;
  devices: Device[];
  queueLength: number;
  lastSync?: string;
}

export interface EncodeCardRequest {
  cardIssueId: string;
  cardPayload: Record<string, any>;
  hotelId: string;
  roomId?: string;
}

export interface EncodeCardResponse {
  ok: boolean;
  result?: {
    cardUID?: string;
    data?: Record<string, any>;
    timestamp?: string;
  };
  error?: string;
}





-- Hotel Lock Card Programming - Database Schema
-- Run this in Supabase SQL Editor

-- hotels (if not exists)
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- users (extends existing auth.users, links to hotels)
CREATE TABLE IF NOT EXISTS hotel_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  role text CHECK (role IN ('admin', 'operator', 'reception')), -- admin, operator, reception
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, hotel_id)
);

-- agents (local edge instances)
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  fingerprint text UNIQUE NOT NULL, -- Machine fingerprint for identification
  agent_token text, -- Encrypted token for agent authentication
  paired_at timestamptz,
  paired_by uuid REFERENCES auth.users(id),
  last_seen timestamptz,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- devices (encoders, terminals)
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  model text NOT NULL,
  serial text,
  vendor text,
  connected boolean DEFAULT true,
  last_used timestamptz,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- rooms (if not exists, may already be in your schema)
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  number text NOT NULL,
  type text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hotel_id, number)
);

-- pairing_tokens (temporary tokens for agent pairing)
CREATE TABLE IF NOT EXISTS pairing_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  agent_name text,
  created_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- card_issues (card programming requests)
CREATE TABLE IF NOT EXISTS card_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES hotel_rooms(id),
  booking_id text, -- Reference to booking if applicable
  user_id uuid REFERENCES auth.users(id), -- Who requested the card
  agent_id uuid REFERENCES agents(id), -- Which agent processed it
  device_id uuid REFERENCES devices(id), -- Which device was used
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'failed', 'queued')),
  card_type text, -- 'authorization_1', 'installation', 'authorization_2', 'clock', 'room'
  payload jsonb DEFAULT '{}'::jsonb, -- Card data to program
  result jsonb DEFAULT '{}'::jsonb, -- Programming result (cardUID, etc.)
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- device_logs (audit log for device events)
CREATE TABLE IF NOT EXISTS device_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  card_issue_id uuid REFERENCES card_issues(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'card_programmed', 'card_read', 'device_connected', 'device_disconnected', 'error'
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_hotel_id ON agents(hotel_id);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_devices_agent_id ON devices(agent_id);
CREATE INDEX IF NOT EXISTS idx_card_issues_hotel_id ON card_issues(hotel_id);
CREATE INDEX IF NOT EXISTS idx_card_issues_status ON card_issues(status);
CREATE INDEX IF NOT EXISTS idx_card_issues_agent_id ON card_issues(agent_id);
CREATE INDEX IF NOT EXISTS idx_card_issues_created_at ON card_issues(created_at);
CREATE INDEX IF NOT EXISTS idx_device_logs_agent_id ON device_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_created_at ON device_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pairing_tokens_token ON pairing_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pairing_tokens_expires_at ON pairing_tokens(expires_at);

-- RLS Policies (Row Level Security)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairing_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth requirements)
-- Hotels: users can read hotels they belong to
CREATE POLICY "Users can read their hotel" ON hotels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hotel_users 
      WHERE hotel_users.hotel_id = hotels.id 
      AND hotel_users.user_id = auth.uid()
    )
  );

-- Agents: users can read agents for their hotel
CREATE POLICY "Users can read agents for their hotel" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hotel_users 
      WHERE hotel_users.hotel_id = agents.hotel_id 
      AND hotel_users.user_id = auth.uid()
    )
  );

-- Card issues: users can read/write card issues for their hotel
CREATE POLICY "Users can manage card issues for their hotel" ON card_issues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM hotel_users 
      WHERE hotel_users.hotel_id = card_issues.hotel_id 
      AND hotel_users.user_id = auth.uid()
    )
  );

-- Device logs: users can read logs for their hotel's agents
CREATE POLICY "Users can read device logs for their hotel" ON device_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      JOIN hotel_users ON hotel_users.hotel_id = agents.hotel_id
      WHERE agents.id = device_logs.agent_id 
      AND hotel_users.user_id = auth.uid()
    )
  );

-- Pairing tokens: admins can create, anyone with token can use
CREATE POLICY "Admins can create pairing tokens" ON pairing_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hotel_users 
      WHERE hotel_users.hotel_id = pairing_tokens.hotel_id 
      AND hotel_users.user_id = auth.uid()
      AND hotel_users.role IN ('admin')
    )
  );

CREATE POLICY "Anyone can read pairing tokens by token value" ON pairing_tokens
  FOR SELECT USING (true); -- Token itself provides security





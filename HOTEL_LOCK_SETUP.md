# Hotel Lock Integration - Setup Guide

This document provides step-by-step instructions for setting up and using the Hotel Lock Card Programming feature.

## Overview

The Hotel Lock integration allows you to program key cards for hotel rooms through your web application. It consists of:

1. **Cloud API** (Next.js + Supabase) - Tracks card issues, agents, and devices
2. **Local Agent** (Electron app) - Runs on hotel computers, interfaces with USB card encoders
3. **Web UI** - Admin interface for managing agents and monitoring card programming

## Phase 1: Database Setup

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database/hotel_lock_schema.sql`
4. Verify tables were created:
   - `hotels`
   - `hotel_users`
   - `agents`
   - `devices`
   - `hotel_rooms`
   - `pairing_tokens`
   - `card_issues`
   - `device_logs`

## Phase 2: Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for API routes (server-side)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for:
- Agent pairing (bypasses RLS)
- Creating card issues
- Updating agent status

## Phase 3: API Routes

The following API routes have been created:

- `POST /api/pairing/generate` - Generate pairing token (admin only)
- `POST /api/pairing/confirm` - Confirm agent pairing
- `GET /api/agents` - List agents for a hotel
- `POST /api/agents/:id/log` - Log device events
- `GET /api/devices` - List devices
- `POST /api/card-issues` - Create card issue
- `GET /api/card-issues` - List card issues
- `PATCH /api/card-issues/:id/status` - Update card issue status

## Phase 4: Web UI

### Agent Management

1. Navigate to `/kabinda-lodge/admin/agents`
2. Click "Pair New Agent"
3. Enter agent name (e.g., "Reception Desk PC")
4. Copy the generated pairing token
5. Use this token in the agent installer

### Card Issue Management

1. Navigate to `/kabinda-lodge/admin/card-issues`
2. View all card programming requests
3. Filter by status (pending, done, failed, etc.)
4. Retry failed card issues

### Enhanced Card Programming Dialog

The `EnhancedCardProgrammingDialog` component integrates with the cloud API:

```tsx
import { EnhancedCardProgrammingDialog } from '@/components/reception/EnhancedCardProgrammingDialog';

<EnhancedCardProgrammingDialog
  open={open}
  onOpenChange={setOpen}
  bookingData={bookingData}
  hotelId={hotelId}
  roomId={roomId}
  onSuccess={(cardIssues) => {
    console.log('Cards programmed:', cardIssues);
  }}
/>
```

## Phase 5: Local Agent Setup

The local agent is located in the `hotel-lock-agent/` directory. It is an Electron application that interfaces with USB encoders.

### Installation & Running

1. Navigate to the agent directory:
   ```bash
   cd hotel-lock-agent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start in development mode:
   ```bash
   npm run dev
   ```

### Mock Mode (Development)

For development without physical hardware, the agent includes a mock encoder (`src/main/encoder-mock.ts`). This allows you to test the full flow without a real card encoder. The mock encoder is used automatically when no physical device is detected or can be configured in `.env`.

### Building for Production

To create an installer for your platform:

```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

### Agent API Endpoints (Local)

The agent implements these endpoints on `https://localhost:8443`:

- `POST /pair` - Pair with cloud using token
- `GET /status` - Return agent and device status
- `POST /encode-card` - Encode a card
- `GET /queue` - List queued jobs
- `POST /queue/replay` - Retry queued jobs

## Phase 6: Integration with Existing Card Programming

The existing `CardProgrammingDialog` component uses a local bridge service. You can:

1. **Keep both systems** - Use the enhanced version for cloud tracking
2. **Migrate gradually** - Replace old dialog with `EnhancedCardProgrammingDialog`
3. **Hybrid approach** - Use cloud API for tracking, local bridge for encoding

## Phase 7: Verification

A testing script is provided to verify the Cloud API endpoints.

1. Ensure your Next.js server is running (`npm run dev`).
2. Run the test script:
   ```bash
   node test-api.js
   ```

This script will:
- Fetch the default hotel
- List agents (if configured)
- List card issues
- Attempt to create a test card issue

## Usage Flow

### 1. Pair an Agent

1. Admin generates pairing token in web UI
2. Install agent on hotel computer
3. Enter pairing token during agent setup
4. Agent pairs with cloud and receives `agentToken`

### 2. Program Cards

1. Reception staff opens card programming dialog
2. System creates `card_issue` record in cloud (status: `pending`)
3. Web app calls local agent: `POST /encode-card`
4. Agent programs card via USB encoder
5. Agent updates cloud: `PATCH /api/card-issues/:id/status` (status: `done`)
6. UI shows success/failure

### 3. Offline Handling

1. If agent is offline, card issue remains `pending`
2. Agent stores job in local SQLite queue
3. When agent comes online, it syncs queued jobs
4. Web UI shows queue length and last sync time

## Security Considerations

1. **Pairing Tokens**: Short-lived (5 minutes), single-use
2. **Agent Tokens**: Stored encrypted on agent, used for authentication
3. **HTTPS**: Local agent uses HTTPS with self-signed certs (development) or trusted certs (production)
4. **RLS Policies**: Database has Row Level Security enabled
5. **API Authentication**: All API routes require authentication

## Troubleshooting

### Agent Not Appearing

- Check if pairing token was used (tokens are single-use)
- Verify agent is calling `/api/pairing/confirm` correctly
- Check Supabase logs for errors

### Card Issues Stuck in Pending

- Verify local agent is running
- Check agent status in `/admin/agents`
- Review device logs in Supabase
- Check network connectivity

### API Errors

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase RLS policies
- Review API route logs in Next.js

## Next Steps

1. **Hardware Testing**: Test with real encoder devices using the built agent.
2. **Device Integration**: Expand `encoder.ts` to support more specific hardware protocols if needed.
3. **Monitoring**: Set up alerts for failed jobs and offline agents in the admin dashboard.
4. **Rollout**: Deploy the agent installers to hotel reception computers.

## Files Created

### Database
- `database/hotel_lock_schema.sql` - Complete database schema

### Types
- `src/types/hotelLock.ts` - TypeScript types for all entities

### API Routes
- `src/app/api/pairing/generate/route.ts`
- `src/app/api/pairing/confirm/route.ts`
- `src/app/api/card-issues/route.ts`
- `src/app/api/card-issues/[id]/status/route.ts`
- `src/app/api/agents/route.ts`
- `src/app/api/agents/[id]/log/route.ts`
- `src/app/api/devices/route.ts`

### Services
- `src/services/hotelLockService.ts` - Client-side service for API calls

### Components
- `src/components/admin/AgentManagement.tsx` - Agent pairing and management UI
- `src/components/reception/EnhancedCardProgrammingDialog.tsx` - Cloud-integrated card programming

### Pages
- `src/page-components/admin/AgentManagement.tsx` - Agent management page
- `src/page-components/admin/CardIssueManagement.tsx` - Card issue monitoring page

### Routes
- Updated `src/routes/paths.ts` with new routes
- Updated `src/App.tsx` with route definitions

## Support

For issues or questions:
1. Check Supabase logs
2. Review Next.js API route logs
3. Check browser console for client errors
4. Verify environment variables are set correctly





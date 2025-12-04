# Quick Start Guide

## Current Status

✅ **TypeScript compilation works**  
✅ **All code structure in place**  
⚠️ **Native modules need path fix** (better-sqlite3, node-hid)

## Workaround: Use Mock Implementations

The agent now automatically falls back to mock implementations if native modules aren't available. This lets you:

- ✅ Test pairing flow
- ✅ Test API integration  
- ✅ Test UI
- ⚠️ Card encoding will be simulated (not real hardware)

## Steps to Run

1. **Build the main process:**
   ```bash
   cd hotel-lock-agent
   npm run build:main
   ```

2. **Create `.env` file:**
   ```env
   CLOUD_API_URL=http://localhost:3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   LOCAL_PORT=8443
   NODE_ENV=development
   ```

3. **Start the agent:**
   ```bash
   npm run dev
   ```

   Or if you just want to test the main process:
   ```bash
   npm run build:main
   npm start
   ```

## What Works Now

- ✅ Pairing with cloud API
- ✅ HTTPS server on localhost:8443
- ✅ Queue management (using JSON file instead of SQLite)
- ✅ Card encoder (mock - simulates encoding)
- ✅ Cloud API integration
- ✅ Status monitoring

## Fixing Native Modules Later

When you're ready to use real hardware:

1. **Option A: Create symlink**
   ```bash
   sudo ln -s "/Users/Pascal Digny/Github Lab/Kabinda Lodge 2.0" ~/kabinda-lodge
   cd ~/kabinda-lodge/hotel-lock-agent
   npm rebuild better-sqlite3 node-hid
   ```

2. **Option B: Move project** (if possible)
   ```bash
   mv "/Users/Pascal Digny/Github Lab/Kabinda Lodge 2.0" ~/kabinda-lodge
   ```

3. **Option C: Use prebuilt binaries**
   Some packages have prebuilt binaries that don't need compilation.

## Testing the Agent

1. Start your Next.js app: `bun dev` (in main project)
2. Start the agent: `npm run dev` (in hotel-lock-agent)
3. Generate pairing token in web app: `/kabinda-lodge/admin/agents`
4. Enter token in agent UI
5. Agent should pair and start polling for card issues

The agent will work with mock implementations for now!





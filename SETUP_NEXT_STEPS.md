# Next Steps After Database Setup

## ✅ Step 1: Verify Tables Were Created

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. You should see these new tables:
   - `hotels`
   - `hotel_users`
   - `agents`
   - `devices`
   - `hotel_rooms`
   - `pairing_tokens`
   - `card_issues`
   - `device_logs`

If you see all 8 tables, the database setup is complete! ✅

---

## 🔑 Step 2: Set Environment Variable

### Get Your Service Role Key

1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **service_role** key (NOT the anon key)
3. Copy it (it starts with `eyJ...`)

### Create/Update .env.local

Create a file named `.env.local` in your project root (same level as `package.json`):

```env
# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://xgcsmkapakcyqxzxpuqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Required for Hotel Lock API routes (server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: 
- The `SUPABASE_SERVICE_ROLE_KEY` is required for agent pairing and card issue management
- Never commit this file to git (it should be in `.gitignore`)
- The service role key bypasses RLS, so keep it secret!

---

## 🧪 Step 3: What You Can Test Now

### Without the Agent (Web UI Only):

1. **Agent Management UI** (`/kabinda-lodge/admin/agents`)
   - ✅ Generate pairing tokens
   - ✅ View agent list (will be empty until agents pair)
   - ❌ Can't actually pair agents yet (needs agent app)

2. **Card Issue Management UI** (`/kabinda-lodge/admin/card-issues`)
   - ✅ View card issues (will be empty)
   - ✅ Filter and search interface
   - ❌ Can't create card issues yet (needs integration with booking flow)

### What Requires the Agent:

- ❌ Actually pairing agents (needs Electron app)
- ❌ Programming cards (needs USB encoder hardware)
- ❌ Real-time agent status (needs agent heartbeat)

---

## 🚀 Step 4: Build the Local Agent (Next Phase)

The local agent is a separate Electron application. According to the spec document, you'll need to:

1. **Create Electron app structure**
   - Main process (Electron)
   - Express server (local HTTPS API)
   - Hardware handlers (serial/HID)
   - SQLite queue for offline jobs

2. **Implement pairing flow**
   - Accept pairing token from UI
   - Call `/api/pairing/confirm` to register
   - Store agent token locally

3. **Implement card encoding**
   - Listen for `/encode-card` requests
   - Interface with USB encoder
   - Update cloud API with results

4. **Package as installer**
   - Use `electron-builder` for Windows/macOS/Linux
   - Include USB drivers if needed
   - Auto-start on boot

---

## 🧪 Quick Test: Verify API Routes Work

After setting up `.env.local`, restart your dev server and test:

```bash
# Restart dev server
npm run dev
# or
bun dev
```

Then try accessing:
- `http://localhost:3000/kabinda-lodge/admin/agents`
- `http://localhost:3000/kabinda-lodge/admin/card-issues`

If you see the pages load without errors, the API routes are working!

---

## 📝 Optional: Create Test Hotel Record

Before testing agent pairing, you might want to create a test hotel:

```sql
-- Run in Supabase SQL Editor
INSERT INTO hotels (name) 
VALUES ('Test Hotel') 
RETURNING id;
```

Save the returned `id` - you'll need it for testing.

---

## 🎯 Summary

**Completed:**
- ✅ Database schema created
- ✅ API routes implemented
- ✅ UI components created

**Next:**
1. ✅ Verify tables exist
2. ✅ Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
3. ✅ Test UI pages load
4. ⏳ Build Electron agent (separate project)
5. ⏳ Test full pairing flow

You're making great progress! The web infrastructure is ready. The agent is the next major piece.





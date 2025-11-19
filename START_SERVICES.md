# 🚀 Starting Kabinda Lodge with Card Programming

You need to run **TWO services** for the card programming system to work:

## Terminal 1: Card Reader Bridge Service

```bash
# Navigate to bridge service
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"

# Install dependencies (first time only)
npm install

# Start the bridge service
npm start
# OR for auto-restart during development:
npm run dev
```

**Expected Output**:
```
[timestamp] Card Reader Bridge Service running on port 3001
[timestamp] Initializing card reader...
[timestamp] Card reader found: [device info]
```

**Verify it's running**:
```bash
curl http://localhost:3001/health
```

**Keep this terminal open!** ✋

---

## Terminal 2: Web Application (Vite Dev Server)

```bash
# Navigate to main project
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"

# Start the web app
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**Access the app**: Open http://localhost:5173 in your browser

---

## Terminal 3: Database Migration (One-time setup)

```bash
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"
supabase db push
```

---

## 🎯 Quick Start (All Commands)

### First Time Setup:
```bash
# Terminal 1 - Bridge Service
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
npm install
npm start

# Terminal 2 - Web App  
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"
npm run dev

# Terminal 3 - Migration (run once)
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"
supabase db push
```

### Daily Use:
```bash
# Terminal 1
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
npm start

# Terminal 2
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"
npm run dev
```

---

## ✅ Verification Checklist

- [ ] Bridge service running on port 3001
- [ ] Web app running on port 5173
- [ ] Database migration applied
- [ ] Card reader connected via USB
- [ ] Can access web app in browser

## 🔍 Troubleshooting

**Bridge service won't start:**
- Check if port 3001 is in use: `lsof -i :3001`
- Check USB card reader is connected
- Try: `npm install` first

**Web app won't start:**
- Check if port 5173 is in use: `lsof -i :5173`
- Clear cache: `rm -rf node_modules/.vite`

**Can't see "Program Key Cards" button:**
- Make sure both services are running
- Check browser console for errors
- Navigate to: Reception Dashboard → Booking Details

---

## 🎮 Using the Card Programming Feature

1. Open web app: http://localhost:5173
2. Login as Receptionist
3. Go to Reception Dashboard
4. Open any booking details
5. Click **"Program Key Cards"** button
6. Follow on-screen instructions

The system will automatically:
- Check if bridge service is available ✅
- Check if card reader is connected ✅
- Guide you through programming 5 cards 🎯

---

## 📊 Service Status

| Service | Port | Status | Check Command |
|---------|------|--------|---------------|
| Bridge Service | 3001 | 🔴 Not Running | `curl localhost:3001/health` |
| Web App | 5173 | 🔴 Not Running | `curl localhost:5173` |
| Database | - | ✅ Ready | - |

Run the commands above to get both services running! 🚀





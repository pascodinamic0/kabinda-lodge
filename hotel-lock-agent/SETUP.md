# Hotel Lock Agent - Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd hotel-lock-agent
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `CLOUD_API_URL` - Your Next.js app URL (e.g., `https://your-app.com`)
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key

3. **Run in Development**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run dist
   ```

## Pairing the Agent

1. **Generate Pairing Token**
   - Go to your web app: `/kabinda-lodge/admin/agents`
   - Click "Pair New Agent"
   - Enter agent name (e.g., "Reception Desk PC")
   - Copy the pairing token

2. **Pair in Agent**
   - Open the Electron app
   - Enter agent name and pairing token
   - Click "Pair Agent"
   - Agent will register with cloud and start polling for card issues

## Building Installers

### Windows
```bash
npm run dist:win
```
Creates a Windows installer in `release/`

### macOS
```bash
npm run dist:mac
```
Creates a macOS DMG in `release/`

### Linux
```bash
npm run dist:linux
```
Creates a Linux AppImage in `release/`

## USB Card Reader Setup

The agent automatically detects USB card readers. To use a specific reader:

1. Find your reader's VID/PID:
   ```bash
   # On macOS/Linux
   lsusb
   
   # On Windows
   # Use Device Manager
   ```

2. Update `src/main/encoder.ts` with your reader's VID/PID

## Troubleshooting

### Agent won't pair
- Check pairing token hasn't expired (5 minutes)
- Verify token hasn't been used
- Check network connectivity to cloud API
- Review logs in console

### Card reader not detected
- Check USB connection
- Verify device permissions (may need admin)
- Update VID/PID in encoder.ts if needed

### HTTPS certificate warnings
- The agent uses self-signed certificates for local HTTPS
- Browsers will show warnings - this is expected
- The web app should handle self-signed certs

## Architecture

- **Main Process**: Electron main process, handles app lifecycle
- **HTTPS Server**: Express server on `https://localhost:8443`
- **Pairing Service**: Manages cloud pairing and agent tokens
- **Card Encoder**: USB HID interface for card programming
- **Queue Manager**: SQLite queue for offline jobs
- **Cloud API Client**: Communicates with Next.js API routes

## Next Steps

1. Test pairing flow
2. Test card encoding with real hardware
3. Test offline queue functionality
4. Package installer for deployment
5. Set up auto-start on boot (OS-specific)





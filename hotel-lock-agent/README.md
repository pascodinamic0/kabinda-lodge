# Hotel Lock Agent

Local Electron application for hotel lock card programming. This agent runs on hotel computers and interfaces with USB card encoders to program key cards.

## Features

- 🔐 **Cloud Pairing**: Pair with cloud API using pairing tokens
- 🔌 **USB Integration**: Interface with USB card encoders via HID
- 📡 **Local HTTPS API**: Expose secure local API for web app communication
- 💾 **Offline Queue**: SQLite queue for offline job processing
- 🔄 **Auto-sync**: Automatically sync queued jobs when online
- 📊 **Status Monitoring**: Real-time status reporting to cloud

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- USB card encoder hardware

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will:
- Start the Electron app
- Watch for TypeScript changes
- Hot reload the renderer process

### Building

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## Configuration

Create a `.env` file in the root directory:

```env
# Cloud API Configuration
CLOUD_API_URL=https://your-app.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Local Server
LOCAL_PORT=8443
LOCAL_HOST=localhost
```

## Usage

### 1. Pair with Cloud

1. Generate a pairing token in the web admin panel
2. Enter the token in the agent's pairing dialog
3. Agent will register with cloud and receive an agent token

### 2. Program Cards

The agent automatically:
- Polls cloud for pending card issues
- Programs cards via USB encoder
- Updates cloud with results
- Queues jobs if offline

### 3. Monitor Status

Check agent status in the web admin panel at `/kabinda-lodge/admin/agents`

## Architecture

```
┌─────────────────┐
│  Electron Main  │
│     Process     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────────┐
│ HTTPS │ │  USB      │
│ Server │ │  Handler  │
└───┬───┘ └──┬────────┘
    │        │
┌───▼────────▼───┐
│  Cloud API     │
│  Integration   │
└───┬────────────┘
    │
┌───▼────────┐
│ SQLite     │
│ Queue      │
└────────────┘
```

## API Endpoints (Local)

The agent exposes these endpoints on `https://localhost:8443`:

- `POST /pair` - Pair with cloud using token
- `GET /status` - Get agent and device status
- `POST /encode-card` - Encode a card (called by web app)
- `GET /queue` - List queued jobs
- `POST /queue/replay` - Retry queued jobs

## Security

- Uses self-signed SSL certificates for local HTTPS
- Agent tokens stored encrypted locally
- All cloud communication over HTTPS
- Pairing tokens are single-use and short-lived

## Troubleshooting

### Agent won't pair
- Check pairing token hasn't expired (5 minutes)
- Verify token hasn't been used already
- Check network connectivity to cloud API

### Cards not programming
- Verify USB encoder is connected
- Check device permissions (may need admin on some systems)
- Review logs in `logs/` directory

### Offline queue not syncing
- Check agent status shows "online"
- Verify cloud API is accessible
- Review error logs for API failures

## License

MIT





# Key Card Programming System - Setup Guide

## Overview

This system automates the programming of NFC/MIFARE key cards for hotel room bookings. It programs 5 cards in sequence:
1. **Authorization Card (1st)** - Initializes the door lock system
2. **Installation Card** - Configures room-specific settings
3. **Authorization Card (2nd)** - Confirms authorization settings
4. **Clock Card** - Synchronizes lock time settings
5. **Room Access Card** - Guest card with booking dates and validation period

## Architecture

- **Local USB Bridge Service**: Node.js service running on the desktop that communicates with the USB card reader
- **Frontend Card Programming Service**: TypeScript service in the web app that communicates with the bridge
- **Card Programming UI**: React dialog component for visual feedback during programming
- **Database Tracking**: Logs all card programming attempts for audit purposes

## Prerequisites

- Node.js 18+ installed on the desktop PC
- USB 3.0 Type B card reader connected
- NFC/MIFARE card reader (NF1/MF0, PnP driver)
- Access to the Kabinda Lodge web application

## Installation

### 1. Install the USB Bridge Service

```bash
# Navigate to the bridge service directory
cd services/card-reader-bridge

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (optional)
nano .env
```

### 2. Start the Bridge Service

**Option A: Manual Start (for testing)**
```bash
npm start
```

**Option B: Run as a Background Service (recommended for production)**

#### On Windows:
1. Install `node-windows` globally:
   ```bash
   npm install -g node-windows
   ```

2. Create a service installer script `install-service.js`:
   ```javascript
   var Service = require('node-windows').Service;

   var svc = new Service({
     name: 'Card Reader Bridge',
     description: 'USB bridge service for NFC/MIFARE card reader',
     script: require('path').join(__dirname, 'index.js')
   });

   svc.on('install', function() {
     svc.start();
   });

   svc.install();
   ```

3. Run the installer:
   ```bash
   node install-service.js
   ```

#### On Linux:
1. Create a systemd service file `/etc/systemd/system/card-reader-bridge.service`:
   ```ini
   [Unit]
   Description=Card Reader Bridge Service
   After=network.target

   [Service]
   Type=simple
   User=your-username
   WorkingDirectory=/path/to/services/card-reader-bridge
   ExecStart=/usr/bin/node index.js
   Restart=always
   RestartSec=10
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   ```

2. Enable and start the service:
   ```bash
   sudo systemctl enable card-reader-bridge
   sudo systemctl start card-reader-bridge
   sudo systemctl status card-reader-bridge
   ```

#### On macOS:
1. Create a LaunchAgent plist file `~/Library/LaunchAgents/com.kabindalodge.cardreader.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.kabindalodge.cardreader</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/path/to/services/card-reader-bridge/index.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardOutPath</key>
       <string>/tmp/cardreader.log</string>
       <key>StandardErrorPath</key>
       <string>/tmp/cardreader.error.log</string>
   </dict>
   </plist>
   ```

2. Load the service:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.kabindalodge.cardreader.plist
   launchctl start com.kabindalodge.cardreader
   ```

### 3. Verify Installation

1. Check if the service is running:
   ```bash
   curl http://localhost:3001/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "readerConnected": true,
     "timestamp": "2025-11-15T..."
   }
   ```

2. Check card reader connection:
   ```bash
   curl http://localhost:3001/api/reader/status
   ```

3. List USB devices (for debugging):
   ```bash
   curl http://localhost:3001/api/devices
   ```

### 4. Database Migration

Run the database migration to add card programming tracking:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually through Supabase dashboard
# Migration file: supabase/migrations/20251115000001_add_card_programming_fields.sql
```

## Usage

### Programming Cards During Booking

1. Navigate to a booking in the Reception Dashboard
2. Open the booking details page
3. Click the "Program Key Cards" button
4. The Card Programming Dialog will open
5. Click "Start Programming"
6. Follow the on-screen instructions to place each card on the reader:
   - Place Authorization Card (1st)
   - Place Installation Card
   - Place Authorization Card (2nd)
   - Place Clock Card
   - Place Room Access Card (give to guest)
7. The system will program each card automatically
8. Success/error status will be shown for each card
9. All programming attempts are logged in the database

### Troubleshooting

#### Bridge Service Not Running
- **Error**: "Card reader service is not running"
- **Solution**: Start the bridge service (see Installation step 2)
- **Check**: Verify service is running on `http://localhost:3001`

#### Card Reader Not Connected
- **Error**: "Card reader is not connected"
- **Solution**: 
  1. Check USB connection
  2. Verify card reader is powered on
  3. Click "Reconnect" button in the UI
  4. Check `/api/devices` endpoint to see if reader is detected

#### Card Detection Timeout
- **Error**: "Card detection timeout"
- **Solution**: 
  1. Ensure card is properly placed on reader
  2. Wait for the "Place Card" instruction before placing card
  3. Keep card on reader until programming is complete

#### Programming Failed
- **Error**: "Programming failed"
- **Solution**: 
  1. Check card compatibility (NF1/MF0)
  2. Try a different card
  3. Restart the bridge service
  4. Check logs: `services/card-reader-bridge/` console output

#### Permission Issues (Linux)
- **Error**: Cannot access USB device
- **Solution**: Add udev rules (see services/card-reader-bridge/README.md)

## Configuration

### Bridge Service Configuration
Edit `services/card-reader-bridge/.env`:
```
PORT=3001
LOG_LEVEL=info
```

### Frontend Configuration
Edit `src/config/cardReaderConfig.ts`:
- Adjust timeouts
- Customize messages
- Configure retry settings

### Card Reader Device IDs
If your card reader is not auto-detected, you can specify exact device IDs:

1. Find your device IDs:
   ```bash
   curl http://localhost:3001/api/devices
   ```

2. Update the detection logic in `services/card-reader-bridge/index.js`:
   ```javascript
   const nfcReader = devices.find(device => {
     return device.vendorId === 0x1234 && device.productId === 0x5678;
   });
   ```

## API Reference

### Bridge Service Endpoints

**GET /health**
- Health check
- Returns: `{ status: 'ok', readerConnected: boolean }`

**GET /api/reader/status**
- Get card reader connection status
- Returns: `{ connected: boolean, reader: object }`

**POST /api/reader/reconnect**
- Reconnect to card reader
- Returns: `{ success: boolean, connected: boolean }`

**POST /api/card/detect**
- Detect card presence
- Returns: `{ success: boolean, card: { uid: string, detected: boolean } }`

**POST /api/card/program**
- Program a single card
- Body: `{ cardType: string, bookingData: object }`
- Returns: `{ success: boolean, result: object }`

**POST /api/card/program-sequence**
- Program all 5 cards in sequence
- Body: `{ bookingData: object }`
- Returns: `{ success: boolean, results: array, completedCards: number, totalCards: number }`

**GET /api/devices**
- List all USB devices (debugging)
- Returns: `{ devices: array }`

## Security Considerations

- The bridge service runs on localhost only (not exposed to network)
- Only authenticated receptionists/admins can trigger card programming
- All programming attempts are logged with user ID and timestamp
- Card UIDs and programming data are stored securely in the database
- RLS policies restrict access to card programming logs

## Maintenance

### Logs
- Bridge service logs: Console output or system logs (depending on setup)
- Card programming logs: Database table `card_programming_log`

### Backup
- Bridge service doesn't store data locally
- All programming history is in the database

### Updates
```bash
cd services/card-reader-bridge
git pull
npm install
# Restart the service
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review bridge service logs
3. Check database `card_programming_log` table for error details
4. Verify USB connection and device detection

## Technical Notes

- Card data format: JSON serialized to buffer
- Communication: HTTP REST API
- Card types: NF1/MF0 MIFARE cards
- Programming timeout: 30 seconds per card, 3 minutes for full sequence
- Retry logic: Automatic retry with exponential backoff





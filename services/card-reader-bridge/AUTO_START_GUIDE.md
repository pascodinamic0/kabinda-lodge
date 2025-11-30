# Card Reader Bridge Service - Auto-Start Guide

This guide explains how to set up the Card Reader Bridge Service to start automatically.

## Option 1: Auto-Start on Login (Recommended for Production)

This will make the service start automatically every time the receptionist logs into their Mac.

### Installation Steps:

1. **Open Terminal**
2. **Navigate to the bridge service directory:**
   ```bash
   cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
   ```

3. **Run the installation script:**
   ```bash
   ./install-auto-start-macos.sh
   ```

4. **The service will now:**
   - Start automatically when you log in
   - Restart automatically if it crashes
   - Run in the background

### Verify Installation:

```bash
# Check if service is loaded
launchctl list | grep cardreader

# Check service status
launchctl start com.kabindalodge.cardreader
curl http://localhost:3001/health
```

### Uninstall Auto-Start:

```bash
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
./uninstall-auto-start-macos.sh
```

---

## Option 2: Manual Start with Launcher Script

For development or when you don't want auto-start:

1. **Double-click** `start-bridge-service.sh` in Finder, OR
2. **Run from Terminal:**
   ```bash
   cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
   ./start-bridge-service.sh
   ```

This will open a new Terminal window with the service running.

---

## Option 3: Manual Start (Terminal)

```bash
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge"
npm start
```

---

## Dashboard Status Indicator

The Reception Dashboard now automatically checks if the service is running:

- ✅ **Green Banner**: Service is running and ready
- ⚠️ **Orange Banner**: Service is not running (with instructions to start it)
- 🔄 **Auto-refresh**: Status checks every 30 seconds

---

## Troubleshooting

### Service won't start:
- Check if port 3001 is already in use: `lsof -i :3001`
- Check logs: `tail -f ~/Library/Logs/cardreader.log`
- Verify Node.js is installed: `node --version`

### Service stops unexpectedly:
- Check error logs: `tail -f ~/Library/Logs/cardreader.error.log`
- The LaunchAgent will automatically restart it (KeepAlive is enabled)

### Card reader not detected:
- Check USB connection
- Verify card reader is powered on
- Check device permissions

---

## Service Management Commands

```bash
# Start service manually
launchctl start com.kabindalodge.cardreader

# Stop service
launchctl stop com.kabindalodge.cardreader

# Restart service
launchctl stop com.kabindalodge.cardreader
launchctl start com.kabindalodge.cardreader

# Check service status
launchctl list | grep cardreader

# View logs
tail -f ~/Library/Logs/cardreader.log
```


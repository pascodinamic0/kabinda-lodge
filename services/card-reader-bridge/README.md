# Card Reader Bridge Service

Local USB bridge service for NFC/MIFARE card reader communication.

## Installation

```bash
cd services/card-reader-bridge
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Adjust settings if needed

## Running the Service

### Quick Start (Recommended)

**Windows:**
- Double-click `start-bridge-service.bat` in File Explorer, OR
- Open Command Prompt/PowerShell in this folder and run: `start-bridge-service.bat`

**macOS/Linux:**
- Double-click `start-bridge-service.sh` in Finder/Files, OR
- Open Terminal in this folder and run: `./start-bridge-service.sh`

### Manual Start

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
npm run dev
```

The service will start on port 3001 by default.

### From Web Application

The web application includes a "Launch Service" button that will:
- Copy the start command to your clipboard
- Open the launcher script location in your file manager
- Provide clear instructions for starting the service

This works on both Windows and macOS.

## API Endpoints

### Health Check
```
GET /health
```

### Get Reader Status
```
GET /api/reader/status
```

### Reconnect Reader
```
POST /api/reader/reconnect
```

### Detect Card
```
POST /api/card/detect
```

### Program Single Card
```
POST /api/card/program
Body: {
  "cardType": "authorization_1|installation|clock|room",
  "bookingData": {
    "bookingId": "123",
    "roomNumber": "101",
    "guestId": "guest-uuid",
    "checkInDate": "2025-11-20",
    "checkOutDate": "2025-11-25"
  }
}
```

### Program Card Sequence
```
POST /api/card/program-sequence
Body: {
  "bookingData": {
    "bookingId": "123",
    "roomNumber": "101",
    "guestId": "guest-uuid",
    "checkInDate": "2025-11-20",
    "checkOutDate": "2025-11-25"
  }
}
```

### List USB Devices (Debug)
```
GET /api/devices
```

## Troubleshooting

### Card reader not detected
1. Check USB connection
2. Verify the card reader is powered on
3. Check `/api/devices` endpoint to see all USB devices
4. Update the device detection logic in `index.js` with your reader's VID/PID

### Permission issues on Linux
You may need to add udev rules for the USB device:
```bash
sudo nano /etc/udev/rules.d/99-nfc-reader.rules
```

Add (replace VENDOR_ID and PRODUCT_ID with your device's IDs):
```
SUBSYSTEM=="usb", ATTRS{idVendor}=="VENDOR_ID", ATTRS{idProduct}=="PRODUCT_ID", MODE="0666"
```

Then reload:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## Notes

- This service must run on the same machine as the card reader
- The web application communicates with this service via HTTP
- Card programming happens sequentially: Authorization → Installation → Authorization → Clock → Room














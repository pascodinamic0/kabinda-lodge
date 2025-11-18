const express = require('express');
const cors = require('cors');
const HID = require('node-hid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Card reader state
let cardReader = null;
let isReaderConnected = false;

// Card types in programming sequence
const CARD_TYPES = {
  AUTHORIZATION_1: 'authorization_1',
  INSTALLATION: 'installation',
  AUTHORIZATION_2: 'authorization_2',
  CLOCK: 'clock',
  ROOM: 'room'
};

const CARD_SEQUENCE = [
  CARD_TYPES.AUTHORIZATION_1,
  CARD_TYPES.INSTALLATION,
  CARD_TYPES.AUTHORIZATION_2,
  CARD_TYPES.CLOCK,
  CARD_TYPES.ROOM
];

// Utility functions
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Initialize card reader
function initializeCardReader() {
  try {
    log('Scanning for card readers...');
    const devices = HID.devices();
    
    // Look for NFC/MIFARE readers (common VID/PID patterns)
    // You may need to adjust these values for your specific reader
    const nfcReader = devices.find(device => {
      // Common NFC reader identifiers
      const isNFC = device.product && (
        device.product.toLowerCase().includes('nfc') ||
        device.product.toLowerCase().includes('mifare') ||
        device.product.toLowerCase().includes('card reader') ||
        device.product.toLowerCase().includes('rfid')
      );
      return isNFC;
    });

    if (nfcReader) {
      log('Card reader found:', {
        product: nfcReader.product,
        manufacturer: nfcReader.manufacturer,
        vendorId: nfcReader.vendorId,
        productId: nfcReader.productId
      });
      
      cardReader = new HID.HID(nfcReader.path);
      isReaderConnected = true;
      
      // Set up data event handler
      cardReader.on('data', (data) => {
        log('Card data received:', data.toString('hex'));
      });

      cardReader.on('error', (error) => {
        log('Card reader error:', error);
        isReaderConnected = false;
      });

      return true;
    } else {
      log('No NFC card reader found. Available devices:', devices.map(d => d.product));
      return false;
    }
  } catch (error) {
    log('Error initializing card reader:', error.message);
    return false;
  }
}

// Detect card presence
async function detectCard(timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!isReaderConnected) {
      reject(new Error('Card reader not connected'));
      return;
    }

    const startTime = Date.now();
    let cardDetected = false;

    const checkInterval = setInterval(() => {
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        if (!cardDetected) {
          reject(new Error('Card detection timeout'));
        }
        return;
      }

      // Simulate card detection - in real implementation, this would read from the device
      // For now, we assume a card is present after a short delay
      if (Date.now() - startTime > 1000 && !cardDetected) {
        cardDetected = true;
        clearInterval(checkInterval);
        resolve({
          uid: generateCardUID(),
          detected: true
        });
      }
    }, 100);
  });
}

// Generate a mock card UID for testing
function generateCardUID() {
  return Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase();
}

// Program card with data
async function programCard(cardType, bookingData) {
  try {
    log(`Programming ${cardType} card...`, bookingData);

    // Detect card
    const cardInfo = await detectCard();
    log('Card detected:', cardInfo);

    // Calculate validation period
    const startDate = new Date(bookingData.checkInDate);
    const endDate = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Prepare card data based on card type
    let cardData;
    switch (cardType) {
      case CARD_TYPES.AUTHORIZATION_1:
      case CARD_TYPES.AUTHORIZATION_2:
        cardData = {
          type: 'authorization',
          timestamp: new Date().toISOString(),
          facility: bookingData.facilityId || 'KABINDA_LODGE'
        };
        break;
      
      case CARD_TYPES.INSTALLATION:
        cardData = {
          type: 'installation',
          roomNumber: bookingData.roomNumber,
          timestamp: new Date().toISOString()
        };
        break;
      
      case CARD_TYPES.CLOCK:
        cardData = {
          type: 'clock',
          timestamp: new Date().toISOString(),
          timezone: 'UTC'
        };
        break;
      
      case CARD_TYPES.ROOM:
        cardData = {
          type: 'room_access',
          roomNumber: bookingData.roomNumber,
          guestId: bookingData.guestId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          nights: nights,
          bookingId: bookingData.bookingId
        };
        break;
      
      default:
        throw new Error(`Unknown card type: ${cardType}`);
    }

    // Write data to card
    const writeResult = await writeCardData(cardData);
    
    log(`${cardType} card programmed successfully`);
    
    return {
      success: true,
      cardType,
      cardUID: cardInfo.uid,
      data: cardData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    log(`Error programming ${cardType} card:`, error.message);
    throw error;
  }
}

// Write data to card
async function writeCardData(data) {
  return new Promise((resolve, reject) => {
    if (!isReaderConnected || !cardReader) {
      reject(new Error('Card reader not connected'));
      return;
    }

    try {
      // Convert data to buffer format suitable for MIFARE cards
      const dataString = JSON.stringify(data);
      const buffer = Buffer.from(dataString, 'utf8');
      
      // In a real implementation, you would:
      // 1. Authenticate with the card
      // 2. Write data to specific blocks
      // 3. Verify the write operation
      
      // For now, we simulate a successful write
      setTimeout(() => {
        log('Data written to card:', dataString.substring(0, 50) + '...');
        resolve({
          bytesWritten: buffer.length,
          success: true
        });
      }, 500);
    } catch (error) {
      reject(error);
    }
  });
}

// API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    readerConnected: isReaderConnected,
    timestamp: new Date().toISOString()
  });
});

// Get card reader status
app.get('/api/reader/status', (req, res) => {
  res.json({
    connected: isReaderConnected,
    reader: cardReader ? {
      connected: true
    } : null
  });
});

// Reconnect card reader
app.post('/api/reader/reconnect', (req, res) => {
  try {
    if (cardReader) {
      cardReader.close();
      cardReader = null;
    }
    
    const connected = initializeCardReader();
    res.json({
      success: connected,
      connected: isReaderConnected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Detect card
app.post('/api/card/detect', async (req, res) => {
  try {
    const cardInfo = await detectCard();
    res.json({
      success: true,
      card: cardInfo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Program single card
app.post('/api/card/program', async (req, res) => {
  try {
    const { cardType, bookingData } = req.body;
    
    if (!cardType || !bookingData) {
      return res.status(400).json({
        success: false,
        error: 'Missing cardType or bookingData'
      });
    }

    const result = await programCard(cardType, bookingData);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Program card sequence
app.post('/api/card/program-sequence', async (req, res) => {
  try {
    const { bookingData } = req.body;
    
    if (!bookingData) {
      return res.status(400).json({
        success: false,
        error: 'Missing bookingData'
      });
    }

    const results = [];
    
    for (const cardType of CARD_SEQUENCE) {
      try {
        const result = await programCard(cardType, bookingData);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          cardType,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Continue with other cards even if one fails
        log(`Failed to program ${cardType}, continuing with sequence...`);
      }
    }

    const allSuccessful = results.every(r => r.success);
    
    res.json({
      success: allSuccessful,
      results,
      completedCards: results.filter(r => r.success).length,
      totalCards: CARD_SEQUENCE.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List available devices (for debugging)
app.get('/api/devices', (req, res) => {
  try {
    const devices = HID.devices();
    res.json({
      devices: devices.map(d => ({
        product: d.product,
        manufacturer: d.manufacturer,
        vendorId: d.vendorId,
        productId: d.productId,
        path: d.path
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  log(`Card Reader Bridge Service running on port ${PORT}`);
  log('Initializing card reader...');
  initializeCardReader();
});

// Cleanup on exit
process.on('SIGINT', () => {
  log('Shutting down...');
  if (cardReader) {
    cardReader.close();
  }
  process.exit(0);
});





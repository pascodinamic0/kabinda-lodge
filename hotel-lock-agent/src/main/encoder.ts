/**
 * Card Encoder
 * Handles USB card encoding via HID
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HID = require('node-hid');

interface EncodeResult {
  success: boolean;
  cardUID?: string;
  error?: string;
}

interface DeviceStatus {
  connected: boolean;
  deviceInfo?: {
    vendorId: number;
    productId: number;
    manufacturer: string;
    product: string;
  };
}

export class CardEncoder {
  private device: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const devices = HID.devices();

      // Look for NFC/MIFARE card readers
      // We search for common keywords in the device description
      const reader = devices.find((device: any) => {
        return (
          device.vendorId &&
          device.productId &&
          (device.manufacturer?.toLowerCase().includes('nfc') ||
            device.product?.toLowerCase().includes('nfc') ||
            device.product?.toLowerCase().includes('mifare') ||
            device.product?.toLowerCase().includes('card') ||
            device.product?.toLowerCase().includes('reader'))
        );
      });

      if (reader && reader.vendorId && reader.productId) {
        try {
          this.device = new HID(reader.vendorId, reader.productId);
          this.isConnected = true;
          console.log(`✅ Card reader connected: ${reader.manufacturer} ${reader.product}`);
        } catch (error) {
          console.error('Failed to open card reader:', error);
          this.isConnected = false;
        }
      } else {
        console.warn('⚠️ No card reader found. Please connect a USB card encoder.');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Error initializing card encoder:', error);
      this.isConnected = false;
    }
  }

  async encodeCard(cardPayload: any): Promise<EncodeResult> {
    // Try to reconnect if not connected
    if (!this.isConnected || !this.device) {
      this.initialize();
    }

    if (!this.isConnected || !this.device) {
      return {
        success: false,
        error: 'No card reader connected. Please check USB connection.',
      };
    }

    try {
      // Detect card
      const cardUID = await this.detectCard();
      if (!cardUID) {
        return {
          success: false,
          error: 'No card detected. Please place a card on the reader.',
        };
      }

      // Encode card based on payload
      await this.writeCardData(cardPayload);

      return {
        success: true,
        cardUID,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to encode card',
      };
    }
  }

  private async detectCard(): Promise<string | null> {
    if (!this.device) return null;
    
    console.log('🔍 Detecting card...');
    
    // REAL IMPLEMENTATION REQUIRED:
    // The command to detect a card depends entirely on the specific card reader hardware (VID/PID).
    // For example, for ACR122U readers, the "Get Data" command is: [0xFF, 0xCA, 0x00, 0x00, 0x00]
    
    // Since we don't know the specific hardware protocol yet, we cannot proceed.
    // Please update this method with the correct APDU command for your reader.
    
    // Example for ACR122U (uncomment if using this reader):
    /*
    try {
      const command = [0xFF, 0xCA, 0x00, 0x00, 0x00];
      this.device.write(command);
      // You would then need to read the response via this.device.read() or 'data' event
    } catch (e) {
      console.error('Error sending command:', e);
    }
    */

    throw new Error('Card reader protocol not implemented. Please update src/main/encoder.ts with your device\'s specific commands.');
  }

  private async writeCardData(data: any): Promise<void> {
    if (!this.device) throw new Error('Device not connected');

    console.log('💾 Writing card data:', JSON.stringify(data, null, 2));
    
    // REAL IMPLEMENTATION REQUIRED:
    // The command to write data depends entirely on the specific card reader hardware and card type (Mifare, etc.).
    // You typically need to:
    // 1. Authenticate with the sector (Load Key -> Authenticate)
    // 2. Write data to the block
    
    throw new Error('Card write protocol not implemented. Please update src/main/encoder.ts with your device\'s specific commands.');
  }

  async getStatus(): Promise<DeviceStatus> {
    if (!this.device) {
      this.initialize();
    }

    const devices = HID.devices();
    const reader = devices.find((device: any) => {
      return (
        device.vendorId &&
        device.productId &&
        (device.manufacturer?.toLowerCase().includes('nfc') ||
          device.product?.toLowerCase().includes('nfc') ||
          device.product?.toLowerCase().includes('mifare'))
      );
    });

    return {
      connected: this.isConnected,
      deviceInfo: reader
        ? {
          vendorId: reader.vendorId!,
          productId: reader.productId!,
          manufacturer: reader.manufacturer || 'Unknown',
          product: reader.product || 'Unknown',
        }
        : undefined,
    };
  }
}


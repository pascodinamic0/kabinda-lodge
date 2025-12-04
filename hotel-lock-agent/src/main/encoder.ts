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
    // Implement card detection logic
    // This is a placeholder - you'll need to implement based on your reader's protocol
    return new Promise((resolve) => {
      console.log('🔍 [Mock] Detecting card...');
      setTimeout(() => {
        // Generate a mock UID for testing
        const uid = Array.from({ length: 4 }, () =>
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
        console.log(`✅ [Mock] Card detected: ${uid}`);
        resolve(uid);
      }, 1000);
    });
  }

  private async writeCardData(data: any): Promise<void> {
    // Implement card writing logic
    // This is a placeholder - you'll need to implement based on your reader's protocol
    return new Promise((resolve) => {
      console.log('💾 [Mock] Writing card data:', JSON.stringify(data, null, 2));
      setTimeout(() => {
        console.log('✅ [Mock] Card data written successfully');
        resolve();
      }, 2000);
    });
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


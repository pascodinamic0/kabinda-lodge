/**
 * Mock Card Encoder (for testing without USB hardware)
 */
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
  private isConnected: boolean = false;

  constructor() {
    // Mock: simulate device detection
    this.isConnected = false; // Set to true to simulate connected device
    console.log('⚠️ Using mock card encoder (no USB hardware)');
  }

  async encodeCard(cardPayload: any): Promise<EncodeResult> {
    // Simulate card encoding delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock: simulate card detection
    const cardUID = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();

    console.log('Mock: Card encoded with UID:', cardUID);
    console.log('Mock: Card payload:', cardPayload);

    return {
      success: true,
      cardUID,
    };
  }

  async getStatus(): Promise<DeviceStatus> {
    return {
      connected: this.isConnected,
      deviceInfo: this.isConnected
        ? {
            vendorId: 0x1234,
            productId: 0x5678,
            manufacturer: 'Mock Reader',
            product: 'Mock NFC Reader',
          }
        : undefined,
    };
  }
}





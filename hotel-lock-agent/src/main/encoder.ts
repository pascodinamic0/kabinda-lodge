// @ts-nocheck
/**
 * Card Encoder
 * Handles USB card encoding via PC/SC (nfc-pcsc)
 * Compatible with ACR122U and generic PN532 readers
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { NFC, Reader } from 'nfc-pcsc';

interface EncodeResult {
  success: boolean;
  cardUID?: string;
  error?: string;
}

interface DeviceStatus {
  connected: boolean;
  deviceInfo?: {
    name: string;
    state?: string;
  };
}

export class CardEncoder {
  private nfc: any = null;
  private reader: any = null;
  private isConnected: boolean = false;
  private lastCard: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.nfc = new NFC();

      this.nfc.on('reader', (reader: any) => {
        console.log(`✅ Reader detected: ${reader.name}`);
        this.reader = reader;
        this.isConnected = true;

        reader.on('card', (card: any) => {
          console.log(`💳 Card detected: ${card.uid}`);
          this.lastCard = card;
        });

        reader.on('card.off', (card: any) => {
          console.log(`👋 Card removed: ${card.uid}`);
          this.lastCard = null;
        });

        reader.on('error', (err: any) => {
          console.error(`❌ Reader error:`, err);
          this.isConnected = false;
        });

        reader.on('end', () => {
          console.log(`⚠️ Reader removed: ${reader.name}`);
          this.reader = null;
          this.isConnected = false;
        });
      });

      this.nfc.on('error', (err: any) => {
        console.error('❌ NFC Error:', err);
      });

    } catch (error) {
      console.error('Error initializing card encoder:', error);
      this.isConnected = false;
    }
  }

  async encodeCard(cardPayload: any): Promise<EncodeResult> {
    if (!this.isConnected || !this.reader) {
      // Try to re-init if possible, but nfc-pcsc usually handles auto-detection
      return {
        success: false,
        error: 'No card reader connected',
      };
    }

    // Wait for card if not present
    if (!this.lastCard) {
      // Simple timeout-based wait for card
      // In a real scenario, we might want to emit an event to the UI to ask user to tap card
      console.log('⏳ Waiting for card...');
      let retries = 0;
      while (!this.lastCard && retries < 20) { // Wait up to 10 seconds (20 * 500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      
      if (!this.lastCard) {
        return {
          success: false,
          error: 'No card detected. Please place a card on the reader.',
        };
      }
    }

    try {
      console.log('🔄 Starting encoding process...');
      const card = this.lastCard;
      
      // TARGET BLOCK: Sector 1, Block 4 (First block of sector 1)
      // MIFARE Classic 1K has 16 sectors (0-15). Each sector has 4 blocks (0-3).
      // Block 4 is Sector 1, Block 0.
      const SECTOR = 1;
      const BLOCK = 4;
      
      // 1. Load Authentication Key (Key A: FF FF FF FF FF FF)
      // CMD: FF 82 00 00 06 [KEY]
      const loadKeyCmd = Buffer.from([0xFF, 0x82, 0x00, 0x00, 0x06, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
      await this.reader.transmit(loadKeyCmd, 40);
      
      // 2. Authenticate
      // CMD: FF 86 00 00 05 01 00 [BLOCK] 60 00
      // 60 = Key A, 61 = Key B
      const authCmd = Buffer.from([0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00, BLOCK, 0x60, 0x00]);
      await this.reader.transmit(authCmd, 40);
      
      // 3. Prepare Data
      // We have 16 bytes. We will structure it as:
      // Byte 0-3:  Hotel ID Magic Bytes (e.g., "KABI" = 0x4B 0x41 0x42 0x49)
      // Byte 4-7:  Room ID (Uint32LE)
      // Byte 8-11: Check In Date (Unix Timestamp / 60 - minutes since epoch)
      // Byte 12-15: Check Out Date (Unix Timestamp / 60)
      
      // Note: This is a simplified binary format. 
      // Ensure 'cardPayload' matches this expectation.
      // Expecting cardPayload to have: roomId, checkIn (ISO string), checkOut (ISO string)
      
      const dataBuffer = Buffer.alloc(16);
      
      // Magic "KABI"
      dataBuffer.write('KABI', 0);
      
      // Room ID (Parse from string to number, simple hash if it's a UUID, or expect numeric ID)
      // Since supabase IDs are UUIDs, we can't fit them in 4 bytes. 
      // For now, we'll use a placeholder or partial hash. 
      // Better approach: Write Room Number string if it fits (e.g. "101").
      // Let's assume Room Number is short (e.g. "101").
      // Let's change strategy: Write Room Number as string.
      
      const roomNum = cardPayload.roomNumber || '000';
      // Write Room Number at byte 4 (max 4 chars to leave space for dates)
      dataBuffer.write(roomNum.substring(0, 4), 4);
      
      // Dates (Simple UNIX timestamp - seconds)
      const checkIn = cardPayload.checkIn ? Math.floor(new Date(cardPayload.checkIn).getTime() / 1000) : 0;
      const checkOut = cardPayload.checkOut ? Math.floor(new Date(cardPayload.checkOut).getTime() / 1000) : 0;
      
      dataBuffer.writeUInt32LE(checkIn, 8);
      dataBuffer.writeUInt32LE(checkOut, 12);
      
      console.log('💾 Writing data:', dataBuffer.toString('hex'));

      // 4. Write Data
      // CMD: FF D6 00 [BLOCK] 10 [DATA]
      const writeHeader = Buffer.from([0xFF, 0xD6, 0x00, BLOCK, 0x10]);
      const writeCmd = Buffer.concat([writeHeader, dataBuffer]);
      
      await this.reader.transmit(writeCmd, 40);
      
      console.log('✅ Card encoded successfully!');

      return {
        success: true,
        cardUID: this.lastCard.uid,
      };
      
    } catch (error: any) {
      console.error('❌ Encoding failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to encode card',
      };
    }
  }

  async getStatus(): Promise<DeviceStatus> {
    return {
      connected: this.isConnected,
      deviceInfo: this.reader
        ? {
          name: this.reader.name,
          state: 'Connected'
        }
        : undefined,
    };
  }
}

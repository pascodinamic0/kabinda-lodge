/**
 * Card Reader Configuration
 * Settings and constants for card programming
 */

export const CARD_READER_CONFIG = {
  // Bridge service URL
  bridgeServiceUrl: 'http://localhost:3001',
  
  // Connection timeouts (milliseconds)
  healthCheckTimeout: 3000,
  readerStatusTimeout: 5000,
  cardDetectionTimeout: 10000,
  cardProgrammingTimeout: 30000,
  sequenceTimeout: 180000, // 3 minutes for all 5 cards
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 2000,
  
  // Card programming settings
  delayBetweenCards: 1000, // Wait 1 second between cards
  cardDetectionPollingInterval: 100,
  
  // USB device identifiers (adjust for your specific reader)
  // Uncomment and set if you need to specify exact device
  // vendorId: 0x1234,
  // productId: 0x5678,
};

export const CARD_READER_MESSAGES = {
  serviceUnavailable: 'Card reader service is not running. Please start the bridge service on your desktop.',
  readerNotConnected: 'Card reader is not connected. Please check the USB connection.',
  cardNotDetected: 'No card detected. Please place a card on the reader.',
  programmingSuccess: 'Card programmed successfully!',
  programmingFailed: 'Failed to program card. Please try again.',
  sequenceComplete: 'All cards programmed successfully!',
  sequencePartialSuccess: 'Some cards failed to program. Please retry failed cards.',
  sequenceFailed: 'Card programming sequence failed.',
  timeout: 'Operation timed out. Please try again.',
  unknownError: 'An unknown error occurred.',
};

import {
  CreditCard,
  KeyRound,
  ShieldCheck,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CardType, CARD_TYPES } from '@/services/cardProgrammingService';

export const CARD_ICONS = {
  authorization: ShieldCheck,
  installation: Settings,
  clock: Clock,
  room: KeyRound,
};

export const CARD_INSTRUCTIONS = {
  authorization: 'Place the Authorization Card on the reader to authorize the system',
  installation: 'Place the Installation Card on the reader to configure the room',
  clock: 'Place the Clock Card on the reader to sync time',
  room: 'Place the Room Access Card on the reader (this will be given to the guest)',
};

/**
 * Format card data for display
 */
export function formatCardData(cardType: string, data: any): string {
  switch (cardType) {
    case 'authorization':
      return `Authorization card for ${data.facility || 'facility'}`;
    case 'installation':
      return `Installation for Room ${data.roomNumber}`;
    case 'clock':
      return `Clock sync at ${new Date(data.timestamp).toLocaleString()}`;
    case 'room':
      return `Room ${data.roomNumber} access: ${data.nights} night(s)`;
    default:
      return 'Card data';
  }
}














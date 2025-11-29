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

export const CARD_INSTRUCTIONS = {
  authorization_1: 'Place the first Authorization Card on the reader',
  installation: 'Place the Installation Card on the reader',
  authorization_2: 'Place the second Authorization Card on the reader',
  clock: 'Place the Clock Card on the reader',
  room: 'Place the Room Access Card on the reader (this will be given to the guest)',
};

export const CARD_ICONS = {
  authorization_1: '🔐',
  installation: '⚙️',
  authorization_2: '🔐',
  clock: '⏰',
  room: '🔑',
};

/**
 * Calculate validation period for room card
 */
export function calculateValidationPeriod(checkInDate: string, checkOutDate: string): {
  startDate: Date;
  endDate: Date;
  nights: number;
} {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  
  // Calculate number of nights
  const diffTime = end.getTime() - start.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    startDate: start,
    endDate: end,
    nights: Math.max(1, nights),
  };
}

/**
 * Format card data for display
 */
export function formatCardData(cardType: string, data: any): string {
  switch (cardType) {
    case 'authorization_1':
    case 'authorization_2':
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














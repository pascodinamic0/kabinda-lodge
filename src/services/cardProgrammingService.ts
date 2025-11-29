/**
 * Card Programming Service
 * Communicates with the local USB bridge service to program NFC/MIFARE cards
 */

const BRIDGE_SERVICE_URL = 'http://localhost:3001';

export interface BookingData {
  bookingId: string | number;
  roomNumber: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  facilityId?: string;
}

export interface CardProgrammingResult {
  success: boolean;
  cardType: string;
  cardUID?: string;
  data?: any;
  timestamp?: string;
  error?: string;
}

export interface SequenceProgrammingResult {
  success: boolean;
  results: CardProgrammingResult[];
  completedCards: number;
  totalCards: number;
  error?: string;
}

export type CardType = 
  | 'authorization_1'
  | 'installation'
  | 'authorization_2'
  | 'clock'
  | 'room';

export const CARD_TYPES = {
  AUTHORIZATION_1: 'authorization_1' as CardType,
  INSTALLATION: 'installation' as CardType,
  AUTHORIZATION_2: 'authorization_2' as CardType,
  CLOCK: 'clock' as CardType,
  ROOM: 'room' as CardType,
};

export const CARD_SEQUENCE: CardType[] = [
  CARD_TYPES.AUTHORIZATION_1,
  CARD_TYPES.INSTALLATION,
  CARD_TYPES.AUTHORIZATION_2,
  CARD_TYPES.CLOCK,
  CARD_TYPES.ROOM,
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  authorization_1: 'Authorization Card (First)',
  installation: 'Installation Card',
  authorization_2: 'Authorization Card (Second)',
  clock: 'Clock Card',
  room: 'Room Access Card',
};

export const CARD_TYPE_DESCRIPTIONS: Record<CardType, string> = {
  authorization_1: 'Initializes the door lock system',
  installation: 'Configures room-specific settings',
  authorization_2: 'Confirms authorization settings',
  clock: 'Synchronizes lock time settings',
  room: 'Guest access card with booking dates',
};

/**
 * Check if the bridge service is available
 */
export async function checkBridgeServiceStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch (error) {
    console.error('Bridge service not available:', error);
    return false;
  }
}

/**
 * Get card reader status
 */
export async function getReaderStatus(): Promise<{
  connected: boolean;
  reader?: any;
}> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/reader/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    throw new Error('Failed to get reader status');
  } catch (error) {
    console.error('Error getting reader status:', error);
    throw error;
  }
}

/**
 * Reconnect to card reader
 */
export async function reconnectReader(): Promise<boolean> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/reader/reconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success && data.connected;
    }
    
    return false;
  } catch (error) {
    console.error('Error reconnecting reader:', error);
    return false;
  }
}

/**
 * Detect card presence
 */
export async function detectCard(): Promise<{
  success: boolean;
  card?: { uid: string; detected: boolean };
  error?: string;
}> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/card/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error detecting card:', error);
    return {
      success: false,
      error: error.message || 'Failed to detect card',
    };
  }
}

/**
 * Program a single card
 */
export async function programSingleCard(
  cardType: CardType,
  bookingData: BookingData
): Promise<CardProgrammingResult> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/card/program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardType, bookingData }),
      signal: AbortSignal.timeout(30000),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        cardType,
        cardUID: data.result.cardUID,
        data: data.result.data,
        timestamp: data.result.timestamp,
      };
    } else {
      return {
        success: false,
        cardType,
        error: data.error || 'Programming failed',
      };
    }
  } catch (error: any) {
    console.error(`Error programming ${cardType} card:`, error);
    return {
      success: false,
      cardType,
      error: error.message || 'Programming failed',
    };
  }
}

/**
 * Program card sequence (all 5 cards)
 */
export async function programCardSequence(
  bookingData: BookingData,
  onProgress?: (cardType: CardType, status: 'waiting' | 'programming' | 'success' | 'error') => void
): Promise<SequenceProgrammingResult> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/card/program-sequence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingData }),
      signal: AbortSignal.timeout(180000), // 3 minutes for all cards
    });
    
    const data = await response.json();
    
    return {
      success: data.success,
      results: data.results || [],
      completedCards: data.completedCards || 0,
      totalCards: data.totalCards || 5,
      error: data.error,
    };
  } catch (error: any) {
    console.error('Error programming card sequence:', error);
    return {
      success: false,
      results: [],
      completedCards: 0,
      totalCards: 5,
      error: error.message || 'Sequence programming failed',
    };
  }
}

/**
 * Program card sequence with step-by-step progress
 */
export async function programCardSequenceStepByStep(
  bookingData: BookingData,
  onProgress: (cardType: CardType, status: 'waiting' | 'programming' | 'success' | 'error', result?: CardProgrammingResult) => void
): Promise<SequenceProgrammingResult> {
  const results: CardProgrammingResult[] = [];
  
  for (const cardType of CARD_SEQUENCE) {
    // Notify waiting state
    onProgress(cardType, 'waiting');
    
    // Wait a moment before starting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Notify programming state
    onProgress(cardType, 'programming');
    
    // Program the card
    const result = await programSingleCard(cardType, bookingData);
    results.push(result);
    
    // Notify result
    if (result.success) {
      onProgress(cardType, 'success', result);
    } else {
      onProgress(cardType, 'error', result);
    }
    
    // Wait before next card
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const completedCards = results.filter(r => r.success).length;
  const allSuccessful = completedCards === CARD_SEQUENCE.length;
  
  return {
    success: allSuccessful,
    results,
    completedCards,
    totalCards: CARD_SEQUENCE.length,
  };
}

/**
 * Get list of USB devices (for debugging)
 */
export async function getUSBDevices(): Promise<any[]> {
  try {
    const response = await fetch(`${BRIDGE_SERVICE_URL}/api/devices`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.devices || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting USB devices:', error);
    return [];
  }
}














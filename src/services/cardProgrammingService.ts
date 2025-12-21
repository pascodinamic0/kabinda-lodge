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
  | 'authorization'
  | 'installation'
  | 'clock'
  | 'room';

export const CARD_TYPES = {
  AUTHORIZATION: 'authorization' as CardType,
  INSTALLATION: 'installation' as CardType,
  CLOCK: 'clock' as CardType,
  ROOM: 'room' as CardType,
};

export const CARD_SEQUENCE: CardType[] = [
  CARD_TYPES.AUTHORIZATION,
  CARD_TYPES.INSTALLATION,
  CARD_TYPES.CLOCK,
  CARD_TYPES.ROOM,
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  authorization: 'Authorization Card',
  installation: 'Installation Card',
  clock: 'Clock Card',
  room: 'Room Card (Guest)',
};

export const CARD_TYPE_DESCRIPTIONS: Record<CardType, string> = {
  authorization: 'Authorizes the lock for programming',
  installation: 'Configures lock for specific room',
  clock: 'Syncs lock time',
  room: 'Grants guest access',
};

/**
 * Check if the bridge service is available
 */
export async function checkBridgeServiceStatus(): Promise<boolean> {
  try {
    // Use a more robust timeout approach that works across environments
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(`${BRIDGE_SERVICE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        // Add headers to prevent CORS issues
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    // Suppress network errors - these are expected when service is not running
    // Only log unexpected errors that aren't network-related
    const isNetworkError = 
      error.name === 'TypeError' || 
      error.name === 'AbortError' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Network request failed');
    
    if (!isNetworkError) {
      console.error('Bridge service error:', error);
    }
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
  } catch (error: any) {
    // Re-throw as a more descriptive error for network failures
    if (error.name === 'TypeError' || error.name === 'AbortError') {
      throw new Error('Bridge service is not available');
    }
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
  } catch (error: any) {
    // Only log unexpected errors, not network failures
    if (error.name !== 'TypeError' && error.name !== 'AbortError') {
      console.error('Error reconnecting reader:', error);
    }
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
    // Provide more descriptive error messages
    if (error.name === 'TypeError' || error.name === 'AbortError') {
      return {
        success: false,
        error: 'Bridge service is not available. Please start the card reader service.',
      };
    }
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
  } catch (error: any) {
    // Only log unexpected errors, not network failures
    if (error.name !== 'TypeError' && error.name !== 'AbortError') {
      console.error('Error getting USB devices:', error);
    }
    return [];
  }
}














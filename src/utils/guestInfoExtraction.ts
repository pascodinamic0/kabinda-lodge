/**
 * Guest Information Extraction Utilities
 * Extracts guest information from booking notes and other sources
 */

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  guests: string;
}

/**
 * Extract guest information from booking notes
 * Expected format: "Guest: Name, Email: email@example.com, Guests: 2, Phone: +123456789, Notes: Additional info"
 */
export const extractGuestInfo = (notes: string = '', fallbackUser?: any): GuestInfo => {
  // Extract guest name
  const nameMatch = notes.match(/Guest:\s*([^,]+)/i);
  const guestName = nameMatch ? nameMatch[1].trim() : (fallbackUser?.name || 'Guest');

  // Extract guest email
  const emailMatch = notes.match(/Email:\s*([^,\s]+)/i);
  const guestEmail = emailMatch ? emailMatch[1].trim() : (fallbackUser?.email || '');

  // Extract guest phone
  const phoneMatch = notes.match(/Phone:\s*([^,\n]+)/i);
  const guestPhone = phoneMatch ? phoneMatch[1].trim() : (fallbackUser?.phone || '');

  // Extract number of guests
  const guestsMatch = notes.match(/Guests:\s*([^,\n]+)/i);
  const guestCount = guestsMatch ? guestsMatch[1].trim() : '1';

  return {
    name: guestName,
    email: guestEmail,
    phone: guestPhone,
    guests: guestCount
  };
};

/**
 * Extract additional booking notes (everything after "Notes:")
 */
export const extractBookingNotes = (notes: string = ''): string => {
  const notesMatch = notes.match(/Notes:\s*(.+)/i);
  return notesMatch ? notesMatch[1].trim() : '';
};

/**
 * Determine actual payment method from payment data
 */
export const determinePaymentMethod = (paymentMethod: string, transactionRef?: string): string => {
  // Check if transaction reference indicates cash payment
  if (transactionRef?.toUpperCase().includes('CASH')) {
    return 'cash';
  }
  
  // Return the stored payment method
  return paymentMethod;
};

/**
 * Format guest information for display
 */
export const formatGuestInfo = (guestInfo: GuestInfo) => {
  return {
    displayName: guestInfo.name || 'Guest',
    displayEmail: guestInfo.email || 'Not provided',
    displayPhone: guestInfo.phone || 'Not provided',
    displayGuests: guestInfo.guests || '1'
  };
};
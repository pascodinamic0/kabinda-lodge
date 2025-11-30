/**
 * Guest Information Extraction Utilities
 * Extracts guest information from booking notes and other sources
 */

import { getGuestName } from './guestNameUtils';

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  guests: string;
}

// Staff roles that should never appear as guest names
const STAFF_ROLES = ['Admin', 'SuperAdmin', 'Receptionist', 'Staff'];

/**
 * Extract guest information from booking data
 * For hotel bookings: Uses native columns (guest_name, guest_email, guest_phone)
 * For conference bookings: Parses notes format: "Guest: Name, Email: email@example.com, Guests: 2, Phone: +123456789, Notes: Additional info"
 * IMPORTANT: Staff names are NEVER used as guest names
 */
export const extractGuestInfo = (notes: string = '', fallbackUser?: any, bookingData?: any): GuestInfo => {
  const guestsMatch = notes.match(/Guests:\s*([^,\n]+)/i);
  const guestCount = guestsMatch ? guestsMatch[1].trim() : '1';

  // First priority: Check if booking has native guest columns (hotel bookings)
  // Check if ANY guest field exists (even if null, the column exists in schema)
  // We check if bookingData exists and has these properties, not their values
  const hasNativeColumns = bookingData && (
    'guest_name' in bookingData || 
    'guest_email' in bookingData || 
    'guest_phone' in bookingData || 
    'guest_company' in bookingData
  );
  
  if (hasNativeColumns) {
    // Extract company from notes if guest_company column is empty or null
    // Check for both null/undefined and empty string
    const guestCompany = bookingData?.guest_company;
    const hasCompanyInColumn = guestCompany && typeof guestCompany === 'string' && guestCompany.trim() !== '';
    let companyFromNotes = '';
    
    if (!hasCompanyInColumn && notes && typeof notes === 'string') {
      // Try multiple patterns to catch different formats
      // Pattern 1: "Company: XYZ" or "company: XYZ"
      let companyMatch = notes.match(/Company:\s*([^,\n\r]+)/i);
      if (!companyMatch) {
        // Pattern 2: "COMPANY: XYZ" (all caps)
        companyMatch = notes.match(/COMPANY:\s*([^,\n\r]+)/i);
      }
      if (!companyMatch) {
        // Pattern 3: "Company - XYZ" or "company - XYZ"
        companyMatch = notes.match(/Company\s*-\s*([^,\n\r]+)/i);
      }
      if (!companyMatch) {
        // Pattern 4: Just look for "Company" followed by text (more flexible)
        companyMatch = notes.match(/[Cc]ompany[:\s-]+([^,\n\r]+)/i);
      }
      
      if (companyMatch && companyMatch[1]) {
        companyFromNotes = companyMatch[1].trim();
        // Remove any trailing punctuation or extra spaces
        companyFromNotes = companyFromNotes.replace(/[.,;]+$/, '').trim();
      }
    }
    
    // Use native columns with fallback to notes, then user data, then empty string
    const finalCompany = (hasCompanyInColumn ? guestCompany.trim() : '') || companyFromNotes || fallbackUser?.company || '';
    
    return {
      name: bookingData?.guest_name || getGuestName(bookingData, fallbackUser) || 'Guest',
      email: bookingData?.guest_email || fallbackUser?.email || '',
      phone: bookingData?.guest_phone || fallbackUser?.phone || '',
      company: finalCompany,
      guests: guestCount
    };
  }

  // Second priority: Extract from notes (conference bookings)
  const nameMatch = notes.match(/Guest:\s*([^,]+)/i);
  let guestName = nameMatch ? nameMatch[1].trim() : null;
  
  // If no name in notes, use getGuestName utility (which excludes staff)
  if (!guestName) {
    guestName = getGuestName(bookingData, fallbackUser);
  }

  const emailMatch = notes.match(/Email:\s*([^,\s]+)/i);
  const guestEmail = emailMatch ? emailMatch[1].trim() : '';

  const phoneMatch = notes.match(/Phone:\s*([^,\n]+)/i);
  const guestPhone = phoneMatch ? phoneMatch[1].trim() : '';

  const companyMatch = notes.match(/Company:\s*([^,\n]+)/i);
  const guestCompany = companyMatch ? companyMatch[1].trim() : '';

  return {
    name: guestName,
    email: guestEmail,
    phone: guestPhone,
    company: guestCompany,
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
    displayCompany: guestInfo.company || 'Not provided',
    displayGuests: guestInfo.guests || '1'
  };
};
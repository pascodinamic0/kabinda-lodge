/**
 * Utility functions for booking operations
 * Handles 9:30 AM expiration logic for bookings
 */

/**
 * Get the current date and time in Africa/Lubumbashi timezone
 */
export function getLocalDateTime(): { date: string; time: string; hour: number; minute: number } {
  // Create a date in Africa/Lubumbashi timezone (CAT - Central Africa Time, UTC+2)
  const now = new Date();
  const lubumbashiOffset = 2 * 60; // UTC+2 in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const lubumbashiTime = new Date(utc + (lubumbashiOffset * 60000));
  
  const year = lubumbashiTime.getFullYear();
  const month = String(lubumbashiTime.getMonth() + 1).padStart(2, '0');
  const day = String(lubumbashiTime.getDate()).padStart(2, '0');
  const hour = lubumbashiTime.getHours();
  const minute = lubumbashiTime.getMinutes();
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    hour,
    minute
  };
}

/**
 * Check if a booking is currently active considering 9:30 AM expiration
 * A booking is active if:
 * - It has started (start_date <= today)
 * - It hasn't expired:
 *   - If end_date is in the future, it's active
 *   - If end_date is today, it's active only if current time is before 9:30 AM
 *   - If end_date is in the past, it's not active
 * 
 * @param startDate - Booking start date (YYYY-MM-DD)
 * @param endDate - Booking end date (YYYY-MM-DD)
 * @param status - Booking status (must be 'booked', 'confirmed', or 'pending_verification')
 * @returns true if booking is active, false otherwise
 */
export function isBookingActive(
  startDate: string,
  endDate: string,
  status: string
): boolean {
  const activeStatuses = ['booked', 'confirmed', 'pending_verification'];
  
  // Check if status is active
  if (!status || !activeStatuses.includes(status)) {
    return false;
  }
  
  const { date: today, hour, minute } = getLocalDateTime();
  
  // Booking hasn't started yet
  if (startDate > today) {
    return false;
  }
  
  // Booking ended on a previous day
  if (endDate < today) {
    return false;
  }
  
  // Booking ends today - check if it's before 9:30 AM
  if (endDate === today) {
    // If current time is 9:30 AM or later, booking has expired
    if (hour > 9 || (hour === 9 && minute >= 30)) {
      return false;
    }
    return true;
  }
  
  // Booking ends in the future
  return true;
}

/**
 * Check if a date range conflicts with any active bookings
 * Considers 9:30 AM expiration when checking for conflicts
 * 
 * @param startDate - Proposed start date (YYYY-MM-DD)
 * @param endDate - Proposed end date (YYYY-MM-DD)
 * @param existingBookings - Array of existing bookings with start_date, end_date, and status
 * @returns true if there's a conflict, false otherwise
 */
export function hasBookingConflict(
  startDate: string,
  endDate: string,
  existingBookings: Array<{ start_date: string; end_date: string; status: string }>
): boolean {
  for (const booking of existingBookings) {
    // Skip if booking is not active
    if (!isBookingActive(booking.start_date, booking.end_date, booking.status)) {
      continue;
    }
    
    // Check for date overlap
    // Conflict exists if: startDate < booking.end_date AND endDate > booking.start_date
    // But we need to account for 9:30 AM expiration
    const bookingStart = booking.start_date;
    const bookingEnd = booking.end_date;
    
    // If booking ends today and it's after 9:30 AM, it's not active, so no conflict
    const { date: today, hour, minute } = getLocalDateTime();
    if (bookingEnd === today && (hour > 9 || (hour === 9 && minute >= 30))) {
      continue;
    }
    
    // Check for overlap
    if (startDate < bookingEnd && endDate > bookingStart) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter active bookings from an array of bookings
 * 
 * @param bookings - Array of bookings with start_date, end_date, and status
 * @returns Array of active bookings
 */
export function filterActiveBookings<T extends { start_date: string; end_date: string; status: string }>(
  bookings: T[]
): T[] {
  return bookings.filter(booking => 
    isBookingActive(booking.start_date, booking.end_date, booking.status)
  );
}


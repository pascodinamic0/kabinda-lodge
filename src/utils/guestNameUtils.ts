/**
 * Utility functions for handling guest name display
 * Ensures staff/admin names are never shown as guest names
 */

// Staff roles that should never appear as guest names
const STAFF_ROLES = ['Admin', 'SuperAdmin', 'Receptionist', 'Staff'];

/**
 * Gets the guest name from booking data, ensuring staff names are never used
 * @param bookingData - The booking object with guest_name field
 * @param userData - Optional user data with name and role
 * @returns The guest name or 'Guest' if no valid guest name is found
 */
export const getGuestName = (
  bookingData: any,
  userData?: { name?: string; role?: string } | null
): string => {
  // First priority: Use the guest_name field if it exists
  if (bookingData?.guest_name && bookingData.guest_name.trim()) {
    return bookingData.guest_name;
  }

  // Second priority: Use user name ONLY if they are NOT staff
  if (userData?.name && userData.name.trim()) {
    // Check if user is staff - if so, don't use their name
    if (userData.role && STAFF_ROLES.includes(userData.role)) {
      return 'Guest';
    }
    // User is a regular guest, use their name
    return userData.name;
  }

  // Default: Return 'Guest'
  return 'Guest';
};

/**
 * Gets guest name specifically for bookings with user join
 * @param booking - Booking object that may have a 'users' joined property
 * @returns The guest name or 'Guest'
 */
export const getGuestNameFromBooking = (booking: any): string => {
  const userData = booking.users ? {
    name: booking.users.name,
    role: booking.users.role
  } : null;

  return getGuestName(booking, userData);
};













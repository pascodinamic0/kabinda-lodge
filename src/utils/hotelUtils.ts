/**
 * Hotel Utilities
 * Helper functions for hotel management
 * For single-hotel systems, creates/retrieves default hotel
 */
import { supabase } from '@/integrations/supabase/client';

let cachedHotelId: string | null = null;

// Fallback hotel ID if all else fails (you can set this to your known hotel ID)
const FALLBACK_HOTEL_ID = '80f538c0-4273-438d-96ba-738e7330136b';

/**
 * Get or create the default hotel for Kabinda Lodge
 * Since this is a single-hotel system, we use a default hotel
 */
export async function getDefaultHotelId(): Promise<string> {
  // Return cached value if available
  if (cachedHotelId) {
    return cachedHotelId;
  }

  console.log('Getting default hotel ID...');

  try {
    // First, try direct query (should work now with updated RLS policy)
    console.log('Trying direct query...');
    const { data: hotels, error: queryError } = await supabase
      .from('hotels')
      .select('id')
      .limit(1)
      .maybeSingle();

    console.log('Direct query result:', { hotels, error: queryError });

    if (hotels && !queryError) {
      console.log('Found hotel:', hotels.id);
      cachedHotelId = hotels.id;
      return hotels.id;
    }

    // If direct query fails, try API route (uses service role key, bypasses RLS)
    if (queryError) {
      console.log('Direct query failed, trying API route...', queryError);
      try {
        const response = await fetch('/api/hotels/get-default', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          if (data.hotelId) {
            cachedHotelId = data.hotelId;
            return data.hotelId;
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error response:', errorData);
        }
      } catch (apiError: any) {
        console.error('API route error:', apiError);
      }
    }

    // If still no hotel found, try to create one via API
    console.log('No hotel found, trying to create via API...');
    try {
      const response = await fetch('/api/hotels/create-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { hotelId } = await response.json();
        cachedHotelId = hotelId;
        return hotelId;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hotel via API');
      }
    } catch (apiError: any) {
      console.error('API error creating hotel:', apiError);
      // Last resort: use fallback hotel ID if we know it exists
      console.warn('Using fallback hotel ID:', FALLBACK_HOTEL_ID);
      cachedHotelId = FALLBACK_HOTEL_ID;
      return FALLBACK_HOTEL_ID;
    }
  } catch (error: any) {
    console.error('Error getting default hotel:', error);
    // Last resort: use fallback hotel ID
    console.warn('Using fallback hotel ID due to error:', FALLBACK_HOTEL_ID);
    cachedHotelId = FALLBACK_HOTEL_ID;
    return FALLBACK_HOTEL_ID;
  }
}

/**
 * Clear cached hotel ID (useful for testing or when hotel changes)
 */
export function clearHotelCache() {
  cachedHotelId = null;
}


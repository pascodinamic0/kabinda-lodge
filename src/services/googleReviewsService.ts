import { supabase } from "@/integrations/supabase/client";

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp
  profile_photo_url?: string;
  relative_time_description: string;
}

export interface CachedReview {
  id: string;
  review_id: string;
  author_name: string;
  rating: number;
  text: string | null;
  time: string; // ISO timestamp
  profile_photo_url: string | null;
  relative_time_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleReviewsConfig {
  business_profile_url?: string;
  place_id?: string;
  api_key?: string;
  enabled?: boolean;
  refresh_interval?: number;
  last_sync_time?: string;
  review_count?: number;
}

/**
 * Get Google reviews configuration from website_content
 */
export async function getGoogleReviewsConfig(): Promise<GoogleReviewsConfig | null> {
  try {
    const { data, error } = await supabase
      .from("website_content")
      .select("content")
      .eq("section", "google_reviews_config")
      .eq("language", "en")
      .single();

    if (error || !data) {
      return null;
    }

    return data.content as GoogleReviewsConfig;
  } catch (error) {
    console.error("Error fetching Google reviews config:", error);
    return null;
  }
}

/**
 * Get cached reviews from database
 * Note: google_reviews_cache table needs to be created via migration
 */
export async function getCachedReviews(limit: number = 10): Promise<CachedReview[]> {
  try {
    // Check if table exists by attempting to query it
    const { data, error } = await supabase
      .from("google_reviews_cache")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Error fetching cached Google reviews:", error);
      return [];
    }

    // Transform to CachedReview interface (though it should match closely)
    const reviews: CachedReview[] = (data || []).map((item: any) => ({
      id: item.id,
      review_id: item.review_id,
      author_name: item.author_name,
      rating: item.rating,
      text: item.text,
      time: item.time,
      profile_photo_url: item.profile_photo_url,
      relative_time_description: item.relative_time_description,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return reviews;
  } catch (error) {
    console.error("Error in getCachedReviews:", error);
    return [];
  }
}

/**
 * Sync reviews from Google by calling the edge function
 */
export async function syncReviews(): Promise<{
  success: boolean;
  reviews?: GoogleReview[];
  count?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-google-reviews", {
      method: "POST",
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error syncing reviews:", error);
    return {
      success: false,
      error: error.message || "Failed to sync reviews",
    };
  }
}

/**
 * Fetch Google reviews - tries cached first, then syncs if needed
 */
export async function fetchGoogleReviews(
  forceSync: boolean = false
): Promise<CachedReview[]> {
  try {
    const config = await getGoogleReviewsConfig();

    if (!config || !config.enabled) {
      return [];
    }

    // Get cached reviews
    const cachedReviews = await getCachedReviews(10);

    // Check if we need to sync
    const shouldSync = forceSync || shouldSyncReviews(config, cachedReviews);

    if (shouldSync) {
      // Check if we have required credentials
      if (!config.api_key || !config.place_id) {
        console.warn("Google Reviews enabled but API key or Place ID missing. Skipping sync.");
        return cachedReviews;
      }

      // Try to sync, but don't fail if it doesn't work
      const syncResult = await syncReviews();
      if (syncResult.success) {
        // Fetch fresh cached reviews after sync
        return await getCachedReviews(10);
      } else {
        // If sync fails, return cached reviews if available
        if (cachedReviews.length > 0) {
          console.warn("Sync failed, returning cached reviews:", syncResult.error);
          return cachedReviews;
        }
      }
    }

    return cachedReviews;
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
}

/**
 * Check if reviews should be synced based on refresh interval
 */
function shouldSyncReviews(
  config: GoogleReviewsConfig,
  cachedReviews: CachedReview[]
): boolean {
  // If no cached reviews, we should sync
  if (cachedReviews.length === 0) {
    return true;
  }

  // If no last sync time, we should sync
  if (!config.last_sync_time) {
    return true;
  }

  // Check if refresh interval has passed
  const refreshIntervalHours = config.refresh_interval || 24;
  const lastSync = new Date(config.last_sync_time);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync >= refreshIntervalHours;
}

/**
 * Extract place_id from Google Business Profile URL
 * This is a helper function for the admin panel
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Try direct place_id parameter
    const directMatch = url.match(/[?&]place_id=([^&]+)/);
    if (directMatch) {
      return decodeURIComponent(directMatch[1]);
    }

    // Try to extract from /maps/place/ URL
    // This is complex and may not always work, so we recommend setting place_id manually
    const placeMatch = url.match(/\/maps\/place\/([^/]+)/);
    if (placeMatch) {
      // This is just the business name, not the place_id
      // We'd need to use the Places API Text Search to get the actual place_id
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting place_id:", error);
    return null;
  }
}





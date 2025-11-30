import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp
  profile_photo_url?: string;
  relative_time_description: string;
}

interface GooglePlacesResponse {
  result?: {
    reviews?: GoogleReview[];
    place_id?: string;
  };
  error_message?: string;
  status?: string;
}

// Extract place_id from Google Business Profile URL
function extractPlaceId(url: string): string | null {
  try {
    // Handle different URL formats:
    // https://www.google.com/maps/place/.../@lat,lng,zoom/data=...
    // https://maps.google.com/?cid=...
    // https://g.page/...
    
    // Try to extract from /maps/place/ URL
    const placeMatch = url.match(/\/maps\/place\/[^/]+\/@[\d.-]+,\d+\.\d+,\d+z\/data=([^&]+)/);
    if (placeMatch) {
      const dataParam = placeMatch[1];
      // Extract place_id from data parameter
      const placeIdMatch = dataParam.match(/!3m1!4b1!4m[^!]*!3m[^!]*!1s([^!]+)/);
      if (placeIdMatch) {
        return placeIdMatch[1];
      }
    }
    
    // Try to extract from CID parameter
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      // Convert CID to place_id using Places API Text Search
      return null; // Will need to use Text Search API
    }
    
    // Try direct place_id in URL
    const directMatch = url.match(/[?&]place_id=([^&]+)/);
    if (directMatch) {
      return decodeURIComponent(directMatch[1]);
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting place_id:", error);
    return null;
  }
}

// Fetch place_id using Google Places API Text Search
async function getPlaceIdFromTextSearch(
  apiKey: string,
  businessName: string,
  address?: string
): Promise<string | null> {
  try {
    const query = address ? `${businessName}, ${address}` : businessName;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].place_id;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching place_id from Text Search:", error);
    return null;
  }
}

// Fetch reviews from Google Places API
async function fetchReviewsFromGoogle(
  placeId: string,
  apiKey: string
): Promise<GoogleReview[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,place_id&key=${apiKey}`;
    
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();
    
    if (data.status === "OK" && data.result?.reviews) {
      return data.result.reviews;
    } else if (data.error_message) {
      throw new Error(data.error_message);
    } else {
      throw new Error(`API returned status: ${data.status}`);
    }
  } catch (error) {
    console.error("Error fetching reviews from Google:", error);
    throw error;
  }
}

// Cache reviews in database
async function cacheReviews(
  supabase: any,
  reviews: GoogleReview[]
): Promise<void> {
  try {
    // Get current review IDs from the new reviews
    const newReviewIds = new Set(
      reviews.map((review) => 
        `${review.time}_${review.author_name.replace(/\s+/g, "_")}`
      )
    );
    
    // Get all existing review IDs
    const { data: existingReviews } = await supabase
      .from("google_reviews_cache")
      .select("review_id");
    
    // Delete reviews that are no longer in Google's response
    if (existingReviews && existingReviews.length > 0) {
      const reviewsToDelete = existingReviews
        .filter((r: { review_id: string }) => !newReviewIds.has(r.review_id))
        .map((r: { review_id: string }) => r.review_id);
      
      if (reviewsToDelete.length > 0) {
        // Delete old reviews in batches if needed
        for (const reviewId of reviewsToDelete) {
          await supabase
            .from("google_reviews_cache")
            .delete()
            .eq("review_id", reviewId);
        }
      }
    }
    
    // Insert/update new reviews using upsert
    const reviewsToInsert = reviews.map((review) => ({
      review_id: `${review.time}_${review.author_name.replace(/\s+/g, "_")}`,
      author_name: review.author_name,
      rating: review.rating,
      text: review.text || null,
      time: new Date(review.time * 1000).toISOString(),
      profile_photo_url: review.profile_photo_url || null,
      relative_time_description: review.relative_time_description || null,
    }));
    
    if (reviewsToInsert.length > 0) {
      const { error } = await supabase
        .from("google_reviews_cache")
        .upsert(reviewsToInsert, { onConflict: "review_id" });
      
      if (error) {
        console.error("Error caching reviews:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error in cacheReviews:", error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get configuration from website_content
    const { data: configData, error: configError } = await supabase
      .from("website_content")
      .select("content")
      .eq("section", "google_reviews_config")
      .eq("language", "en")
      .single();

    if (configError || !configData) {
      throw new Error("Google reviews configuration not found");
    }

    const config = configData.content as {
      business_profile_url?: string;
      place_id?: string;
      api_key?: string;
      enabled?: boolean;
      refresh_interval?: number;
    };

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Google reviews are not enabled" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get place_id
    let placeId = config.place_id;
    
    if (!placeId && config.business_profile_url) {
      placeId = extractPlaceId(config.business_profile_url);
      
      // If still no place_id, try Text Search (requires business name)
      if (!placeId && config.api_key) {
        // Note: This would require business name in config
        // For now, we'll require place_id to be set manually
        throw new Error("Could not extract place_id from URL. Please set place_id manually in configuration.");
      }
    }

    if (!placeId) {
      throw new Error("place_id is required. Please configure it in the admin panel.");
    }

    if (!config.api_key) {
      throw new Error("Google Places API key is required. Please configure it in the admin panel.");
    }

    // Fetch reviews from Google
    const reviews = await fetchReviewsFromGoogle(placeId, config.api_key);

    // Cache reviews in database
    await cacheReviews(supabase, reviews);

    // Update last sync time and review count
    await supabase
      .from("website_content")
      .update({
        content: {
          ...config,
          last_sync_time: new Date().toISOString(),
          review_count: reviews.length,
          place_id: placeId || config.place_id || '',
        },
      })
      .eq("section", "google_reviews_config")
      .eq("language", "en");

    return new Response(
      JSON.stringify({
        success: true,
        reviews: reviews.map((review) => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          profile_photo_url: review.profile_photo_url,
          relative_time_description: review.relative_time_description,
        })),
        count: reviews.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error fetching Google reviews:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch Google reviews",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);


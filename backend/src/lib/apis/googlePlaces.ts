import axios from 'axios';
import { withRetry } from '@/lib/fetchWithRetry';
import type { GooglePlaceResult, GooglePlaceDetails } from '@/types/developer';

const GEOAPIFY_BASE = 'https://api.geoapify.com';
const API_KEY = process.env.GEOAPIFY_API_KEY;
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export async function autocompletePlace(input: string): Promise<GooglePlaceResult[]> {
  const response = await axios.get(`${GEOAPIFY_BASE}/v1/geocode/autocomplete`, {
    timeout: 15000,
    params: { text: input, type: 'amenity', limit: 5, apiKey: API_KEY },
  });
  const features = response.data?.features || [];
  return features.map((f: { properties: Record<string, string> }) => ({
    place_id: f.properties.place_id,
    description: f.properties.formatted,
    structured_formatting: {
      main_text: f.properties.name || f.properties.address_line1,
      secondary_text: f.properties.address_line2 || '',
    },
  }));
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const response = await withRetry(() =>
      axios.get(`${GEOAPIFY_BASE}/v2/place-details`, {
        timeout: 15000,
        params: { id: placeId, apiKey: API_KEY },
      })
    );
    const p = response.data?.features?.[0]?.properties;
    if (!p) return null;
    return {
      name: p.name,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      formatted_address: p.formatted,
      website: p.website,
      formatted_phone_number: p.contact?.phone,
      opening_hours: p.opening_hours ? { open_now: true } : undefined,
    };
  } catch {
    return null;
  }
}

export interface ReviewData {
  rating: number | null;
  user_ratings_total: number | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  reviews: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    relative_time_description?: string;
  }>;
  source: 'google_places' | 'serper' | 'none';
}

/**
 * Fetch place rating + reviews via Google Places API.
 * Requires GOOGLE_PLACES_API_KEY.
 * Returns up to 5 reviews (Google Places free tier limit).
 */
export async function getGooglePlaceReviews(
  brandName: string,
  city?: string,
): Promise<ReviewData> {
  const empty: ReviewData = { rating: null, user_ratings_total: null, address: null, website: null, phone: null, reviews: [], source: 'none' };

  if (!GOOGLE_PLACES_KEY) {
    console.warn('[googlePlaces] GOOGLE_PLACES_API_KEY not set — skipping Google Places reviews');
    return empty;
  }

  try {
    // Step 1: find the Google Place ID by name + city
    const query = city ? `${brandName} ${city}` : brandName;
    const findRes = await withRetry(() =>
      axios.get(`${GOOGLE_PLACES_BASE}/findplacefromtext/json`, {
        timeout: 10000,
        params: {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name,rating,user_ratings_total,formatted_address',
          key: GOOGLE_PLACES_KEY,
        },
      })
    );

    const candidate = findRes.data?.candidates?.[0];
    if (!candidate?.place_id) return empty;

    // Step 2: fetch place details with reviews
    const detailsRes = await withRetry(() =>
      axios.get(`${GOOGLE_PLACES_BASE}/details/json`, {
        timeout: 10000,
        params: {
          place_id: candidate.place_id,
          fields: 'name,rating,user_ratings_total,formatted_address,website,formatted_phone_number,reviews',
          key: GOOGLE_PLACES_KEY,
          reviews_sort: 'newest',
        },
      })
    );

    const p = detailsRes.data?.result;
    if (!p) return empty;

    return {
      rating: p.rating ?? null,
      user_ratings_total: p.user_ratings_total ?? null,
      address: p.formatted_address ?? null,
      website: p.website ?? null,
      phone: p.formatted_phone_number ?? null,
      reviews: (p.reviews ?? []).map((r: {
        author_name: string;
        rating: number;
        text: string;
        time: number;
        relative_time_description?: string;
      }) => ({
        author_name: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.time,
        relative_time_description: r.relative_time_description,
      })),
      source: 'google_places',
    };
  } catch (err) {
    console.error('[googlePlaces] Google Places API error:', err instanceof Error ? err.message : err);
    return empty;
  }
}

/**
 * Fallback: use Serper /places to at least get rating + count when
 * Google Places API key is not available.
 */
export async function getSerperPlaceRating(
  brandName: string,
  city?: string,
): Promise<Pick<ReviewData, 'rating' | 'user_ratings_total' | 'address' | 'source'>> {
  try {
    const { getSerpResults } = await import('@/lib/apis/dataForSeo');
    const query = city ? `${brandName} ${city}` : brandName;
    const res = await getSerpResults(query);
    // Serper /places results come back in answerBox or knowledgeGraph for local businesses
    const kg = res?.knowledgeGraph;
    if (kg?.rating) {
      return {
        rating: parseFloat(kg.rating) || null,
        user_ratings_total: kg.reviews ? parseInt(String(kg.reviews).replace(/\D/g, '')) || null : null,
        address: kg.address ?? null,
        source: 'serper',
      };
    }
    return { rating: null, user_ratings_total: null, address: null, source: 'none' };
  } catch {
    return { rating: null, user_ratings_total: null, address: null, source: 'none' };
  }
}

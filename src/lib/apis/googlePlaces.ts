import axios from 'axios';
import type { GooglePlaceResult, GooglePlaceDetails } from '@/types/developer';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export async function autocompletePlace(input: string): Promise<GooglePlaceResult[]> {
  const response = await axios.get(`${PLACES_BASE}/autocomplete/json`, {
    params: {
      input,
      types: 'establishment',
      key: process.env.GOOGLE_PLACES_API_KEY,
    },
  });
  return response.data.predictions || [];
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const response = await axios.get(`${PLACES_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,reviews,formatted_address,website,formatted_phone_number,opening_hours',
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });
    return response.data.result || null;
  } catch {
    return null;
  }
}

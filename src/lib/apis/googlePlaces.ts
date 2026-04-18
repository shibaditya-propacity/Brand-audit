import axios from 'axios';
import type { GooglePlaceResult, GooglePlaceDetails } from '@/types/developer';

const GEOAPIFY_BASE = 'https://api.geoapify.com';
const API_KEY = process.env.GEOAPIFY_API_KEY;

export async function autocompletePlace(input: string): Promise<GooglePlaceResult[]> {
  const response = await axios.get(`${GEOAPIFY_BASE}/v1/geocode/autocomplete`, {
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
    const response = await axios.get(`${GEOAPIFY_BASE}/v2/place-details`, {
      params: { id: placeId, apiKey: API_KEY },
    });
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

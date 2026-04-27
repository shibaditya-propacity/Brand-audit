export interface GooglePlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlaceDetails {
  name: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
  formatted_address?: string;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: { open_now: boolean };
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

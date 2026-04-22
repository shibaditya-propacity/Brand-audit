import { Star } from 'lucide-react';
import { Card } from '@tremor/react';
import { formatDate } from '@/lib/utils';

interface ReviewsWidgetProps {
  gmbData: unknown;
}

interface GmbData {
  rating?: number;
  // support both field names (old: reviewCount, new: user_ratings_total)
  user_ratings_total?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  website?: string;
  reviews?: Array<{ author_name: string; rating: number; text: string; time: number; relative_time_description?: string }>;
  reviewsSource?: 'google_places' | 'serper' | 'none';
}

export function ReviewsWidget({ gmbData }: ReviewsWidgetProps) {
  const data = gmbData as GmbData | null;

  const totalReviews = data?.user_ratings_total ?? data?.reviewCount ?? null;
  const reviews = data?.reviews ?? [];
  const hasGoogleKey = data?.reviewsSource === 'google_places';

  if (!data || (!data.rating && reviews.length === 0)) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Google Reviews</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No Google reviews data available. Make sure the brand has a GMB Place ID set and re-run data collection.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      {/* Header: rating + count */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Google Reviews</h3>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">{data.rating ?? '--'}</span>
          {totalReviews != null && (
            <span className="text-xs text-slate-500 dark:text-slate-400">({totalReviews.toLocaleString()} reviews)</span>
          )}
        </div>
      </div>

      {/* Address / contact */}
      {(data.address || data.phone) && (
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
          {data.address && <p>{data.address}</p>}
          {data.phone && <p>{data.phone}</p>}
        </div>
      )}

      {/* Star breakdown visual */}
      {data.rating != null && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(data.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-600'}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{data.rating}</span>
          <span className="text-xs text-slate-400">/ 5</span>
        </div>
      )}

      {/* Individual reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {reviews.slice(0, 8).map((review, idx) => (
            <div key={idx} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{review.author_name}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-600'}`} />
                  ))}
                </div>
              </div>
              {review.text && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{review.text}</p>}
              {review.time > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {review.relative_time_description ?? formatDate(new Date(review.time * 1000))}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Review text not available</p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            {hasGoogleKey
              ? 'Google Places returned no review text for this business.'
              : 'Add GOOGLE_PLACES_API_KEY to your environment to fetch full review text (free tier: $200/month credit).'}
          </p>
        </div>
      )}
    </Card>
  );
}

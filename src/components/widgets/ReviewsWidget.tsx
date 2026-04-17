import { Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ReviewsWidgetProps {
  gmbData: unknown;
}

export function ReviewsWidget({ gmbData }: ReviewsWidgetProps) {
  const data = gmbData as {
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{ author_name: string; rating: number; text: string; time: number }>;
  } | null;

  if (!data) return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-muted-foreground">No Google reviews data available.</p>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Google Reviews</h3>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-bold">{data.rating ?? '--'}</span>
          <span className="text-xs text-muted-foreground">({data.user_ratings_total?.toLocaleString() ?? 0})</span>
        </div>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {(data.reviews || []).slice(0, 8).map((review, idx) => (
          <div key={idx} className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{review.author_name}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 line-clamp-3">{review.text}</p>
            {review.time && <p className="text-xs text-muted-foreground mt-1">{formatDate(new Date(review.time * 1000))}</p>}
          </div>
        ))}
        {(!data.reviews || data.reviews.length === 0) && (
          <p className="text-sm text-muted-foreground">No reviews collected.</p>
        )}
      </div>
    </div>
  );
}

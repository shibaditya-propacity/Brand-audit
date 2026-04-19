import { Star } from 'lucide-react';
import { Card } from '@tremor/react';
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
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">No Google reviews data available.</p>
    </Card>
  );

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Google Reviews</h3>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">{data.rating ?? '--'}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">({data.user_ratings_total?.toLocaleString() ?? 0})</span>
        </div>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {(data.reviews || []).slice(0, 8).map((review, idx) => (
          <div key={idx} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{review.author_name}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-600'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{review.text}</p>
            {review.time && <p className="text-xs text-slate-400 mt-1">{formatDate(new Date(review.time * 1000))}</p>}
          </div>
        ))}
        {(!data.reviews || data.reviews.length === 0) && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No reviews collected.</p>
        )}
      </div>
    </Card>
  );
}

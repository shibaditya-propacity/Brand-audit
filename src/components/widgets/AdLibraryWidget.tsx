import { ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { Card, Badge } from '@tremor/react';
import { formatDate } from '@/lib/utils';

interface AdLibraryWidgetProps {
  metaAdsData: unknown;
}

export function AdLibraryWidget({ metaAdsData }: AdLibraryWidgetProps) {
  const data = metaAdsData as {
    analysis?: {
      totalAds?: number;
      isActive?: boolean;
      lastAdDate?: string;
      daysSinceLastAd?: number;
      spendRange?: { minMin?: number; maxMax?: number; currency?: string };
      adCopySamples?: Array<{ id: string; copy?: string; title?: string; date?: string; pageName?: string; snapshotUrl?: string }>;
    };
  } | null;

  const analysis = data?.analysis;

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Meta Ad Library</h3>
        {analysis?.isActive !== undefined && (
          <Badge color={analysis.isActive ? 'green' : 'rose'} size="xs">
            {analysis.isActive ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Ads</span>
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{analysis?.totalAds ?? '--'}</p>
        </div>
        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Last Ad</span>
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{analysis?.lastAdDate ? formatDate(analysis.lastAdDate) : '--'}</p>
        </div>
      </div>
      {analysis?.adCopySamples && analysis.adCopySamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Recent Ad Copies</p>
          {analysis.adCopySamples.slice(0, 3).map(ad => (
            <div key={ad.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              {ad.title && <p className="text-xs font-semibold mb-1 text-slate-900 dark:text-slate-100">{ad.title}</p>}
              {ad.copy && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{ad.copy}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-400">{ad.date ? formatDate(ad.date) : ''}</span>
                {ad.snapshotUrl && (
                  <a href={ad.snapshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-0.5">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

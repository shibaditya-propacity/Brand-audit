import { ExternalLink, Calendar, TrendingUp } from 'lucide-react';
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
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Meta Ad Library</h3>
        {analysis?.isActive !== undefined && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${analysis.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {analysis.isActive ? '● Active' : '● Inactive'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Total Ads</span></div>
          <p className="font-semibold">{analysis?.totalAds ?? '--'}</p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 mb-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Last Ad</span></div>
          <p className="font-semibold text-sm">{analysis?.lastAdDate ? formatDate(analysis.lastAdDate) : '--'}</p>
        </div>
      </div>
      {analysis?.adCopySamples && analysis.adCopySamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recent Ad Copies</p>
          {analysis.adCopySamples.slice(0, 3).map(ad => (
            <div key={ad.id} className="rounded-md border p-3">
              {ad.title && <p className="text-xs font-semibold mb-1">{ad.title}</p>}
              {ad.copy && <p className="text-xs text-gray-600 line-clamp-3">{ad.copy}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">{ad.date ? formatDate(ad.date) : ''}</span>
                {ad.snapshotUrl && (
                  <a href={ad.snapshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-0.5">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Search, Link2, Globe } from 'lucide-react';
import { Card } from '@tremor/react';

interface SEOMetricsWidgetProps {
  seoData: unknown;
  backlinksData: unknown;
  domainRanking?: { position?: number } | null;
}

export function SEOMetricsWidget({ seoData: _seoData, backlinksData, domainRanking }: SEOMetricsWidgetProps) {
  const bl = backlinksData as { total_count?: number; referring_domains?: number; rank?: number } | null;
  const pos = domainRanking?.position;

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">SEO Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Search, label: 'Brand Keyword Position', value: pos ? `#${pos}` : 'Not in Top 10' },
          { icon: Link2, label: 'Backlinks', value: bl?.total_count?.toLocaleString() ?? '--' },
          { icon: Globe, label: 'Referring Domains', value: bl?.referring_domains?.toLocaleString() ?? '--' },
          { icon: Globe, label: 'Domain Rank', value: bl?.rank ?? '--' },
        ].map(metric => (
          <div key={metric.label} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <metric.icon className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

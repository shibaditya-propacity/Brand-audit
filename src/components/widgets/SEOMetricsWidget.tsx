import { Search, Link2, Globe } from 'lucide-react';

interface SEOMetricsWidgetProps {
  seoData: unknown;
  backlinksData: unknown;
  domainRanking?: { position?: number } | null;
}

export function SEOMetricsWidget({ seoData, backlinksData, domainRanking }: SEOMetricsWidgetProps) {
  const bl = backlinksData as { total_count?: number; referring_domains?: number; rank?: number } | null;
  const pos = domainRanking?.position;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold text-sm">SEO Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Search, label: 'Brand Keyword Position', value: pos ? `#${pos}` : 'Not in Top 10' },
          { icon: Link2, label: 'Backlinks', value: bl?.total_count?.toLocaleString() ?? '--' },
          { icon: Globe, label: 'Referring Domains', value: bl?.referring_domains?.toLocaleString() ?? '--' },
          { icon: Globe, label: 'Domain Rank', value: bl?.rank ?? '--' },
        ].map(metric => (
          <div key={metric.label} className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <p className="font-semibold text-sm">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

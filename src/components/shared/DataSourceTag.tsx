import { cn } from '@/lib/utils';

const SOURCE_COLORS: Record<string, string> = {
  DataForSEO:   'bg-blue-50 text-blue-700 border-blue-200',
  GooglePlaces: 'bg-green-50 text-green-700 border-green-200',
  HikerAPI:     'bg-pink-50 text-pink-700 border-pink-200',
  MetaAdLibrary:'bg-primary/5 text-primary border-primary/20',
  WebCrawler:   'bg-orange-50 text-orange-700 border-orange-200',
  PDL:          'bg-purple-50 text-purple-700 border-purple-200',
  Screenshot:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  Manual:       'bg-gray-50 text-gray-600 border-gray-200',
};

const SOURCE_DISPLAY: Record<string, string> = {
  DataForSEO:   'SEO Data',
  GooglePlaces: 'Google Places',
  HikerAPI:     'Social Media',
  MetaAdLibrary:'Ad Library',
  WebCrawler:   'Website',
  PDL:          'Company Data',
  Screenshot:   'Screenshot',
  Manual:       'Manual',
};

interface DataSourceTagProps {
  source: string;
  className?: string;
}

export function DataSourceTag({ source, className }: DataSourceTagProps) {
  const colors = SOURCE_COLORS[source] || SOURCE_COLORS.Manual;
  const label  = SOURCE_DISPLAY[source] ?? source;
  return (
    <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium', colors, className)}>
      via {label}
    </span>
  );
}

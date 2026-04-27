import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface WebsiteScreenshotWidgetProps {
  screenshotUrl: string | null | undefined;
  websiteUrl: string | null | undefined;
}

export function WebsiteScreenshotWidget({ screenshotUrl, websiteUrl }: WebsiteScreenshotWidgetProps) {
  if (!screenshotUrl) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Website Screenshot</h3>
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <Image src={screenshotUrl} alt="Website screenshot" width={600} height={400} className="w-full h-auto" unoptimized />
      </div>
    </div>
  );
}

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface WebsiteScreenshotWidgetProps {
  screenshotUrl: string | null | undefined;
  websiteUrl: string | null | undefined;
}

export function WebsiteScreenshotWidget({ screenshotUrl, websiteUrl }: WebsiteScreenshotWidgetProps) {
  if (!screenshotUrl) return null;
  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Website Screenshot</h3>
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="rounded-md overflow-hidden border">
        <Image src={screenshotUrl} alt="Website screenshot" width={600} height={400} className="w-full h-auto" unoptimized />
      </div>
    </div>
  );
}

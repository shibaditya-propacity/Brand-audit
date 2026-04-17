import Link from 'next/link';
import { DIMENSIONS } from '@/config/dimensions';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface DimensionCardProps {
  auditId: string;
  dimensionCode: string;
  score: number | null;
  status: string;
  flagCount?: number;
}

export function DimensionCard({ auditId, dimensionCode, score, status, flagCount = 0 }: DimensionCardProps) {
  const dim = DIMENSIONS.find(d => d.code === dimensionCode);
  if (!dim) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[dim.icon] || Icons.Building2;

  return (
    <Link
      href={`/audit/${auditId}/${dimensionCode.toLowerCase()}`}
      className="block rounded-lg border bg-white p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1.5" style={{ backgroundColor: `${dim.color}20` }}>
            <IconComp className="h-4 w-4" style={{ color: dim.color }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{dim.code}</p>
            <p className="text-sm font-semibold leading-tight">{dim.shortName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ScoreBadge score={score} size="sm" />
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <ProgressBar value={score ?? 0} colorByScore={true} height="h-1.5" className="mb-2" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground capitalize">{status}</span>
        {flagCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />{flagCount} flag{flagCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}

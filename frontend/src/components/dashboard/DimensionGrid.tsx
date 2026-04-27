import { DimensionCard } from './DimensionCard';
import { DIMENSIONS } from '@/config/dimensions';
import type { AuditDimensionResult } from '@/types/audit';

interface DimensionGridProps {
  auditId: string;
  dimensions: AuditDimensionResult[];
}

export function DimensionGrid({ auditId, dimensions }: DimensionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {DIMENSIONS.map(dim => {
        const result = dimensions.find(d => d.code === dim.code);
        const flagCount = Array.isArray(result?.aiFlags) ? result.aiFlags.length : 0;
        return (
          <DimensionCard
            key={dim.code}
            auditId={auditId}
            dimensionCode={dim.code}
            score={result?.score ?? null}
            status={result?.status ?? 'pending'}
            flagCount={flagCount}
          />
        );
      })}
    </div>
  );
}

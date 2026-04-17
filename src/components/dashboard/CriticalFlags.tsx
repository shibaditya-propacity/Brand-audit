import { AlertTriangle } from 'lucide-react';
import { DIMENSIONS } from '@/config/dimensions';
import type { AuditDimensionResult } from '@/types/audit';

interface CriticalFlagsProps {
  dimensions: AuditDimensionResult[];
}

export function CriticalFlags({ dimensions }: CriticalFlagsProps) {
  const allFlags: Array<{ flag: string; dimension: string }> = [];
  for (const dim of dimensions) {
    if (Array.isArray(dim.aiFlags)) {
      dim.aiFlags.forEach(flag => allFlags.push({ flag, dimension: dim.code }));
    }
  }

  if (allFlags.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-800">Critical Flags ({allFlags.length})</h3>
      </div>
      <ul className="space-y-2">
        {allFlags.map((item, idx) => {
          const dim = DIMENSIONS.find(d => d.code === item.dimension);
          return (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 flex-shrink-0 mt-0.5">
                {item.dimension}
              </span>
              <span className="text-red-700">{item.flag}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

'use client';
import { DIMENSIONS } from '@/config/dimensions';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import type { AuditDimensionResult } from '@/types/audit';
import * as Icons from 'lucide-react';

interface DimensionPageShellProps {
  dimensionCode: string;
  dimension: AuditDimensionResult | null | undefined;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export function DimensionPageShell({ dimensionCode, dimension, leftContent, rightContent }: DimensionPageShellProps) {
  const meta = DIMENSIONS.find(d => d.code === dimensionCode);
  if (!meta) return <div className="p-6">Dimension not found</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[meta.icon] || Icons.Building2;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2" style={{ backgroundColor: `${meta.color}20` }}>
          <IconComp className="h-6 w-6" style={{ color: meta.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{meta.name}</h1>
            <span className="text-sm text-muted-foreground">({meta.code} · Weight: {meta.weight}%)</span>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <ScoreBadge score={dimension?.score} size="lg" showLabel />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">{leftContent}</div>
        <div className="lg:col-span-2 space-y-6">{rightContent}</div>
      </div>
    </div>
  );
}

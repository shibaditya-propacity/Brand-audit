'use client';
import { RadarChart } from './RadarChart';
import { DimensionGrid } from './DimensionGrid';
import { CriticalFlags } from './CriticalFlags';
import { AuditProgress } from './AuditProgress';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { getScoreLabel } from '@/config/scoring';
import type { AuditWithRelations } from '@/types/audit';
import { CheckCircle, AlertTriangle, BarChart3, Clock } from 'lucide-react';

interface AuditOverviewProps {
  audit: AuditWithRelations;
  onRefetch: () => void;
}

export function AuditOverview({ audit, onRefetch }: AuditOverviewProps) {
  const dims = audit.dimensions || [];
  const dimensionScores = Object.fromEntries(dims.map(d => [d.code, d.score]));
  const completedDims = dims.filter(d => d.status === 'complete').length;
  const allFlags = dims.flatMap(d => d.aiFlags || []);
  const passItems = dims.flatMap(d => d.items || []).filter(i => i.status === 'PASS').length;
  const failItems = dims.flatMap(d => d.items || []).filter(i => i.status === 'FAIL').length;

  const isRunning = ['COLLECTING', 'ANALYZING'].includes(audit.status);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{audit.developer?.brandName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {audit.developer?.city} · {audit.developer?.positioning} · Audit by {audit.auditorName || 'Propacity'}
          </p>
        </div>
        <div className="text-right">
          <ScoreBadge score={audit.overallScore} size="xl" showLabel />
          {audit.overallScore && (
            <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(audit.overallScore)}</p>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Overall Score', value: audit.overallScore ? `${Math.round(audit.overallScore)}/100` : '--', icon: BarChart3, color: 'text-primary' },
          { label: 'Pass / Fail Items', value: `${passItems} / ${failItems}`, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Critical Flags', value: allFlags.length, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Dims Complete', value: `${completedDims}/10`, icon: Clock, color: 'text-amber-600' },
        ].map(card => (
          <div key={card.label} className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Radar + Progress */}
      {isRunning ? (
        <AuditProgress auditId={audit._id as string} onComplete={onRefetch} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold mb-3">Score Radar</h3>
            <RadarChart dimensionScores={dimensionScores} />
          </div>
          <CriticalFlags dimensions={dims} />
        </div>
      )}

      {/* Dimension Grid */}
      <div>
        <h2 className="font-semibold mb-3">All Dimensions</h2>
        <DimensionGrid auditId={audit._id as string} dimensions={dims} />
      </div>
    </div>
  );
}

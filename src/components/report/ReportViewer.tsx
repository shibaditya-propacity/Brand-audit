'use client';
import { DIMENSIONS } from '@/config/dimensions';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { getScoreLabel } from '@/config/scoring';
import { getItemsByDimension } from '@/config/checklist';
import type { AuditWithRelations, AuditDimensionResult } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';
import type { DimensionCode } from '@/types/checklist';
import { formatDate } from '@/lib/utils';

interface ReportViewerProps {
  audit: AuditWithRelations;
}

function DimensionSection({ dimension, result }: { dimension: typeof DIMENSIONS[0]; result?: AuditDimensionResult }) {
  const items = getItemsByDimension(dimension.code as DimensionCode);
  const findings = result?.aiFindings as unknown as AIDimensionOutput | undefined;
  const aiItems = findings?.items || [];

  return (
    <div className="mb-8 break-inside-avoid">
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2" style={{ borderColor: dimension.color }}>
        <h2 className="text-lg font-bold">{dimension.code}: {dimension.name}</h2>
        <ScoreBadge score={result?.score} size="md" />
      </div>
      {findings?.summary && <p className="text-sm text-gray-700 mb-3">{findings.summary}</p>}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-1.5 text-left">Item</th>
            <th className="border border-gray-200 p-1.5 text-left">Status</th>
            <th className="border border-gray-200 p-1.5 text-left">Finding</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 10).map(item => {
            const ai = aiItems.find(r => r.code === item.code);
            return (
              <tr key={item.code} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-1.5 font-medium">{item.code}: {item.label}</td>
                <td className="border border-gray-200 p-1.5">
                  <StatusPill status={ai?.status as 'pass' | 'fail' | 'partial' | null} />
                </td>
                <td className="border border-gray-200 p-1.5 text-gray-600">{ai?.finding || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ReportViewer({ audit }: ReportViewerProps) {
  const dims = audit.dimensions || [];
  const dimensionMap = Object.fromEntries(dims.map(d => [d.code, d]));

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      {/* Cover */}
      <div className="text-center mb-12 pb-8 border-b-4 border-primary">
        <h1 className="text-3xl font-black mb-2">Brand Audit Report</h1>
        <h2 className="text-xl font-bold text-primary mb-1">{audit.developer?.brandName}</h2>
        <p className="text-muted-foreground">{audit.developer?.city} · {audit.developer?.positioning}</p>
        <p className="text-sm text-muted-foreground mt-2">Audit Date: {formatDate(audit.auditDate || new Date())} · Auditor: {audit.auditorName || 'Propacity'}</p>
        {audit.overallScore && (
          <div className="mt-6 inline-block rounded-2xl border-4 border-primary px-8 py-4">
            <p className="text-5xl font-black text-primary">{Math.round(audit.overallScore)}</p>
            <p className="text-sm text-muted-foreground mt-1">{getScoreLabel(audit.overallScore)}</p>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      {audit.objective && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Audit Objective</h2>
          <p className="text-sm text-gray-700">{audit.objective}</p>
        </div>
      )}

      {/* Score table */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Dimension Scores</h2>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="border border-gray-200 p-2 text-left">Dimension</th><th className="border border-gray-200 p-2 text-center">Weight</th><th className="border border-gray-200 p-2 text-center">Score</th><th className="border border-gray-200 p-2 text-left">Status</th></tr></thead>
          <tbody>
            {DIMENSIONS.map(d => {
              const result = dimensionMap[d.code];
              return (
                <tr key={d.code}>
                  <td className="border border-gray-200 p-2">{d.code}: {d.name}</td>
                  <td className="border border-gray-200 p-2 text-center">{d.weight}%</td>
                  <td className="border border-gray-200 p-2 text-center"><ScoreBadge score={result?.score} size="sm" /></td>
                  <td className="border border-gray-200 p-2">{result?.score ? getScoreLabel(result.score) : 'Pending'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dimension sections */}
      {DIMENSIONS.map(d => (
        <DimensionSection key={d.code} dimension={d} result={dimensionMap[d.code]} />
      ))}
    </div>
  );
}

import { CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import type { AuditDimensionResult } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';

interface AIFindingsPanelProps {
  dimension: AuditDimensionResult | null | undefined;
}

export function AIFindingsPanel({ dimension }: AIFindingsPanelProps) {
  if (!dimension?.aiFindings) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-muted-foreground">AI analysis not yet available. Run the audit to generate findings.</p>
      </div>
    );
  }

  const findings = dimension.aiFindings as unknown as AIDimensionOutput;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold">AI Analysis</h3>
      {findings.summary && (
        <p className="text-sm text-gray-700 leading-relaxed">{findings.summary}</p>
      )}
      {findings.strengths && findings.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Strengths</span>
          </div>
          <ul className="space-y-1">
            {findings.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {findings.criticalFlags && findings.criticalFlags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Critical Issues</span>
          </div>
          <ul className="space-y-1">
            {findings.criticalFlags.map((f, i) => (
              <li key={i} className="text-sm text-red-600 flex items-start gap-1.5">
                <span className="mt-0.5">⚠</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {findings.quickWins && findings.quickWins.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Quick Wins</span>
          </div>
          <ul className="space-y-1">
            {findings.quickWins.map((w, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">→</span>{w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

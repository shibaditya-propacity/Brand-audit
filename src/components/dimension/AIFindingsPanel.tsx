import { Card, CategoryBar, Callout, List, ListItem } from '@tremor/react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import type { AuditDimensionResult } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';

interface AIFindingsPanelProps {
  dimension: AuditDimensionResult | null | undefined;
}

export function AIFindingsPanel({ dimension }: AIFindingsPanelProps) {
  if (!dimension?.aiFindings) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          AI analysis not yet available. Run the audit to generate findings.
        </p>
      </Card>
    );
  }

  const findings = dimension.aiFindings as unknown as AIDimensionOutput;
  const score = dimension.score ?? 0;

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Analysis</h3>

      {score > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Score: {Math.round(score)}/100</span>
          </div>
          <CategoryBar
            values={[Math.min(score, 40), Math.max(0, Math.min(score - 40, 20)), Math.max(0, Math.min(score - 60, 15)), Math.max(0, Math.min(score - 75, 15)), Math.max(0, score - 90)]}
            colors={['rose', 'orange', 'yellow', 'green', 'emerald']}
            className="mt-1"
          />
        </div>
      )}

      {findings.summary && (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{findings.summary}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {findings.strengths && findings.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Strengths</span>
            </div>
            <List>
              {findings.strengths.map((s, i) => (
                <ListItem key={i} className="text-xs text-slate-600 dark:text-slate-300">
                  {s}
                </ListItem>
              ))}
            </List>
          </div>
        )}
        {findings.criticalFlags && findings.criticalFlags.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Issues</span>
            </div>
            <List>
              {findings.criticalFlags.map((f, i) => (
                <ListItem key={i} className="text-xs text-rose-600 dark:text-rose-400">
                  {f}
                </ListItem>
              ))}
            </List>
          </div>
        )}
      </div>

      {findings.quickWins && findings.quickWins.length > 0 && (
        <Callout
          title="Quick Wins"
          icon={Zap}
          color="yellow"
          className="mt-2"
        >
          <ul className="space-y-1 mt-1">
            {findings.quickWins.map((w, i) => (
              <li key={i} className="text-xs">→ {w}</li>
            ))}
          </ul>
        </Callout>
      )}
    </Card>
  );
}

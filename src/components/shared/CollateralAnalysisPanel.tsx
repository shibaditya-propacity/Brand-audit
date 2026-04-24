'use client';
import { AlertTriangle, FileText, CheckCircle2, TrendingUp, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, Badge } from '@tremor/react';
import type { CollateralAnalysisResult } from '@/types/audit';

interface CollateralAnalysisPanelProps {
  analysis: CollateralAnalysisResult | null | undefined;
  hasDocs: boolean;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 75 ? 'bg-green-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50';
  return (
    <div className={`flex-shrink-0 flex items-center justify-center rounded-full h-14 w-14 ${bg}`}>
      <span className={`text-xl font-bold ${color}`}>{score}</span>
    </div>
  );
}

export function CollateralAnalysisPanel({ analysis, hasDocs }: CollateralAnalysisPanelProps) {
  if (!hasDocs || !analysis) {
    return (
      <Card className="bg-amber-50 border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Collateral analysis may be incomplete</p>
            <p className="text-xs text-amber-700 mt-0.5">
              No collateral documents were uploaded during audit setup. Upload brochures or project docs to get a
              full collateral analysis.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const tierColor =
    analysis.score >= 75 ? 'green' : analysis.score >= 50 ? 'yellow' : 'red';

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Collateral Analysis</h3>
            <Badge color={tierColor} size="xs">{analysis.score}/100</Badge>
            <span className="text-xs text-slate-400">
              {analysis.docsAnalyzed} doc{analysis.docsAnalyzed !== 1 ? 's' : ''} analysed · Groq AI
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{analysis.summary}</p>
        </div>
        <ScoreRing score={analysis.score} />
      </div>

      {/* Market Positioning */}
      {analysis.marketPositioning && (
        <div className="rounded-md bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 p-3">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
            Market Positioning
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{analysis.marketPositioning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Key Findings */}
        {analysis.keyFindings.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <TrendingUp className="h-3.5 w-3.5" /> Key Findings
            </div>
            {analysis.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </div>
        )}

        {/* Gaps */}
        {analysis.gaps.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlertCircle className="h-3.5 w-3.5" /> Gaps
            </div>
            {analysis.gaps.map((g, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                {g}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Lightbulb className="h-3.5 w-3.5" /> Recommendations
            </div>
            {analysis.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Lightbulb className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                {r}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

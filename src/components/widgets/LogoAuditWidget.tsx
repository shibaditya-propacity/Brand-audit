import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoAuditWidgetProps {
  logoUrl: string | null | undefined;
  logoAnalysis: unknown;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  B: 'bg-green-100 text-green-800 border-green-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-orange-100 text-orange-800 border-orange-300',
  F: 'bg-red-100 text-red-800 border-red-300',
};

export function LogoAuditWidget({ logoUrl, logoAnalysis }: LogoAuditWidgetProps) {
  const analysis = logoAnalysis as {
    overallGrade?: string;
    positioningScore?: number;
    modernityScore?: number;
    versatilityScore?: number;
    colorScore?: number;
    typographyScore?: number;
    strengths?: string[];
    issues?: string[];
  } | null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Logo Audit</h3>
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <div className="h-16 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            <Image src={logoUrl} alt="Brand logo" width={64} height={64} className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">No logo</div>
        )}
        {analysis?.overallGrade && (
          <div className={cn('text-4xl font-black rounded-xl border-2 flex items-center justify-center h-16 w-16', GRADE_COLORS[analysis.overallGrade] || GRADE_COLORS.C)}>
            {analysis.overallGrade}
          </div>
        )}
      </div>
      {analysis && (
        <div className="space-y-2">
          {[
            { label: 'Positioning', score: analysis.positioningScore },
            { label: 'Modernity', score: analysis.modernityScore },
            { label: 'Versatility', score: analysis.versatilityScore },
            { label: 'Color', score: analysis.colorScore },
            { label: 'Typography', score: analysis.typographyScore },
          ].map(item => item.score !== undefined && (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-20">{item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.score / 10) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-6 text-right text-slate-700 dark:text-slate-300">{item.score}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

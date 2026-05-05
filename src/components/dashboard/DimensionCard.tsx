import Link from 'next/link';
import { DIMENSIONS } from '@/config/dimensions';
import { ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface DimensionCardProps {
  auditId: string;
  dimensionCode: string;
  score: number | null;
  status: string;
  flagCount?: number;
}

function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 60) return '#f97316';
  if (score < 75) return '#eab308';
  if (score < 90) return '#22c55e';
  return '#10b981';
}

function getScoreBg(score: number): string {
  if (score < 40) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  if (score < 60) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  if (score < 75) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
  if (score < 90) return 'bg-green-500/10 text-green-600 dark:text-green-400';
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
}

export function DimensionCard({ auditId, dimensionCode, score, status, flagCount = 0 }: DimensionCardProps) {
  const dim = DIMENSIONS.find(d => d.code === dimensionCode);
  if (!dim) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[dim.icon] || Icons.Building2;
  const safeScore  = score ?? 0;
  const hasScore   = score !== null;
  const barColor   = hasScore ? getScoreColor(safeScore) : '#cbd5e1';
  const scoreBg    = hasScore ? getScoreBg(safeScore) : '';
  const isPending  = status === 'pending';

  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -2 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <Link href={`/audit/${auditId}/${dimensionCode.toLowerCase()}`} className="block group h-full">
        <div className="relative h-full rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4 transition-all hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 overflow-hidden">

          {/* Color accent on hover */}
          <div
            className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
            style={{ background: dim.color }}
          />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="rounded-xl p-2 flex-shrink-0 transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${dim.color}18` }}
              >
                <IconComp className="h-3.5 w-3.5" style={{ color: dim.color }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{dim.code}</p>
                <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">{dim.shortName}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {hasScore ? (
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${scoreBg}`}>
                  {Math.round(safeScore)}
                </span>
              ) : isPending ? (
                <Clock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              ) : (
                <span className="text-xs text-slate-400">--</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${safeScore}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium capitalize ${
              status === 'complete' ? 'text-emerald-600 dark:text-emerald-400' :
              status === 'failed'   ? 'text-rose-500 dark:text-rose-400'      :
              'text-slate-400 dark:text-slate-500'
            }`}>
              {status}
            </span>
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="h-2.5 w-2.5" />{flagCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

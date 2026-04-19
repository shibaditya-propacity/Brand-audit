import Link from 'next/link';
import { DIMENSIONS } from '@/config/dimensions';
import { Card, Badge, ProgressBar } from '@tremor/react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface DimensionCardProps {
  auditId: string;
  dimensionCode: string;
  score: number | null;
  status: string;
  flagCount?: number;
}

function getTremorColor(score: number): 'red' | 'orange' | 'yellow' | 'green' | 'emerald' {
  if (score < 40) return 'red';
  if (score < 60) return 'orange';
  if (score < 75) return 'yellow';
  if (score < 90) return 'green';
  return 'emerald';
}

export function DimensionCard({ auditId, dimensionCode, score, status, flagCount = 0 }: DimensionCardProps) {
  const dim = DIMENSIONS.find(d => d.code === dimensionCode);
  if (!dim) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[dim.icon] || Icons.Building2;
  const safeScore = score ?? 0;
  const tier = getTremorColor(safeScore);

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <Link href={`/audit/${auditId}/${dimensionCode.toLowerCase()}`} className="block group">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5 flex-shrink-0" style={{ backgroundColor: `${dim.color}20` }}>
                <IconComp className="h-4 w-4" style={{ color: dim.color }} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{dim.code}</p>
                <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-200">{dim.shortName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {score !== null ? (
                <Badge color={tier} size="xs">{Math.round(score)}</Badge>
              ) : (
                <span className="text-xs text-slate-400">--</span>
              )}
              <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <ProgressBar value={safeScore} color={tier} className="mb-2 h-1" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 capitalize">{status}</span>
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-500">
                <AlertTriangle className="h-3 w-3" />{flagCount}
              </span>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

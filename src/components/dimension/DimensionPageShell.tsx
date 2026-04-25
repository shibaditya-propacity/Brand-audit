'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DIMENSIONS } from '@/config/dimensions';
import { Card, Badge, Text } from '@tremor/react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';
import type { AuditDimensionResult } from '@/types/audit';
import * as Icons from 'lucide-react';
import { RerunButton } from './RerunButton';

interface DimensionPageShellProps {
  dimensionCode: string;
  dimension: AuditDimensionResult | null | undefined;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  auditId: string;
  onRerunComplete?: () => void;
}

function getTremorColor(score: number): 'red' | 'orange' | 'yellow' | 'green' | 'emerald' {
  if (score <= 40) return 'red';
  if (score <= 60) return 'orange';
  if (score <= 75) return 'yellow';
  if (score <= 90) return 'green';
  return 'emerald';
}

export function DimensionPageShell({ dimensionCode, dimension, leftContent, rightContent, auditId, onRerunComplete }: DimensionPageShellProps) {
  const meta = DIMENSIONS.find(d => d.code === dimensionCode);
  const [alertDismissed, setAlertDismissed] = useState(false);
  if (!meta) return <div className="p-6">Dimension not found</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[meta.icon] || Icons.Building2;
  const score = dimension?.score ?? 0;
  const tier = getTremorColor(score);
  const ringData = [{ name: 'Score', value: score, fill: meta.color }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div
            className="rounded-xl p-3 flex-shrink-0"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            <IconComp className="h-7 w-7" style={{ color: meta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{meta.name}</h1>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {meta.code} · Weight: {meta.weight}%
              </span>
            </div>
            <Text className="text-slate-500 dark:text-slate-400 mt-1">{meta.description}</Text>
            {dimension?.aiSummary && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {dimension.aiSummary}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {score > 0 && <Badge color={tier} size="sm">{score}/100</Badge>}
              <RerunButton
                auditId={auditId}
                dimensionCode={dimensionCode}
                onComplete={onRerunComplete}
              />
            </div>
          </div>
          {score > 0 && (
            <div className="flex-shrink-0 relative" style={{ width: 80, height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="65%" outerRadius="90%"
                  data={ringData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={6} background />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  <CountUp end={score} duration={2} enableScrollSpy />
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Manual input hint banner */}
      <AnimatePresence>
        {!alertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-2.5"
          >
            <Icons.PenLine className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              You can manually fill in data for this dimension —{' '}
              <button
                type="button"
                onClick={() => {
                  document.querySelector('[data-manual-form]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
              >
                Manual Data Input form is at the bottom
              </button>
              . Fill it and click &ldquo;Save &amp; Rerun Analysis&rdquo; to update the AI analysis.
            </p>
            <button
              type="button"
              onClick={() => setAlertDismissed(true)}
              className="flex-shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              aria-label="Dismiss"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-3 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {leftContent}
        </motion.div>
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {rightContent}
        </motion.div>
      </div>
    </motion.div>
  );
}

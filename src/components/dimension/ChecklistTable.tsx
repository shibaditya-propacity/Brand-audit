'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Card, Badge, Callout } from '@tremor/react';
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, ChevronDown, Info, Database } from 'lucide-react';
import { getItemsByDimension } from '@/config/checklist';
import type { AuditDimensionResult } from '@/types/audit';
import type { DimensionCode } from '@/types/checklist';
import type { AIDimensionOutput, AIItemResult } from '@/types/aiOutputs';

interface ChecklistTableProps {
  dimensionCode: DimensionCode;
  dimension: AuditDimensionResult | null | undefined;
}

function getStatusIcon(status: string | undefined) {
  switch (status?.toUpperCase()) {
    case 'PASS': return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
    case 'FAIL': return <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />;
    case 'PARTIAL': return <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
    case 'NA': return <MinusCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />;
    default: return <MinusCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />;
  }
}

function getStatusBadgeColor(status: string | undefined): 'emerald' | 'rose' | 'yellow' | 'gray' {
  switch (status?.toUpperCase()) {
    case 'PASS': return 'emerald';
    case 'FAIL': return 'rose';
    case 'PARTIAL': return 'yellow';
    default: return 'gray';
  }
}

function ChecklistItem({
  item,
  result,
}: {
  item: ReturnType<typeof getItemsByDimension>[0];
  result?: AIItemResult;
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = result?.finding || result?.recommendation;
  const statusDisplay = result?.status?.toUpperCase() || 'PENDING';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
    >
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
        <Collapsible.Root open={open} onOpenChange={v => hasDetails && setOpen(v)}>
          <Collapsible.Trigger asChild>
            <button
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${hasDetails ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' : 'cursor-default'}`}
              disabled={!hasDetails}
            >
              {getStatusIcon(result?.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400">{item.code}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                </div>
              </div>
              <Badge color={getStatusBadgeColor(result?.status)} size="xs">
                {statusDisplay}
              </Badge>
              {result?.priority && (
                <Badge
                  color={result.priority === 'critical' ? 'rose' : result.priority === 'high' ? 'orange' : result.priority === 'medium' ? 'yellow' : 'gray'}
                  size="xs"
                >
                  {result.priority}
                </Badge>
              )}
              {hasDetails && (
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </motion.span>
              )}
            </button>
          </Collapsible.Trigger>

          <AnimatePresence initial={false}>
            {open && hasDetails && (
              <Collapsible.Content forceMount asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="p-3 space-y-2">
                    {result?.finding && (
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Finding: </span>{result.finding}
                        </p>
                      </div>
                    )}
                    {result?.recommendation && (
                      <Callout title="Recommendation" color="indigo" className="text-xs py-2">
                        {result.recommendation}
                      </Callout>
                    )}
                    {item.dataSource && (
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{item.dataSource}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Collapsible.Content>
            )}
          </AnimatePresence>
        </Collapsible.Root>
      </Card>
    </motion.div>
  );
}

export function ChecklistTable({ dimensionCode, dimension }: ChecklistTableProps) {
  const items = getItemsByDimension(dimensionCode);
  const findings = dimension?.aiFindings as unknown as AIDimensionOutput | undefined;
  const aiItems = findings?.items || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Checklist ({items.length} items)
        </h3>
        <div className="flex gap-2">
          {[
            { label: 'Pass', count: aiItems.filter(i => i.status === 'pass').length, color: 'emerald' as const },
            { label: 'Fail', count: aiItems.filter(i => i.status === 'fail').length, color: 'rose' as const },
            { label: 'Partial', count: aiItems.filter(i => i.status === 'partial').length, color: 'yellow' as const },
          ].filter(s => s.count > 0).map(s => (
            <Badge key={s.label} color={s.color} size="xs">{s.count} {s.label}</Badge>
          ))}
        </div>
      </div>
      <motion.div
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {items.map(item => {
          const result = aiItems.find(r => r.code === item.code);
          return <ChecklistItem key={item.code} item={item} result={result} />;
        })}
      </motion.div>
    </div>
  );
}

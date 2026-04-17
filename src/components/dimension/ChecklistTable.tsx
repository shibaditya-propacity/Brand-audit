'use client';
import { StatusPill } from '@/components/shared/StatusPill';
import { DataSourceTag } from '@/components/shared/DataSourceTag';
import { getItemsByDimension } from '@/config/checklist';
import type { AuditDimensionResult } from '@/types/audit';
import type { DimensionCode } from '@/types/checklist';
import type { AIDimensionOutput, AIItemResult } from '@/types/aiOutputs';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChecklistTableProps {
  dimensionCode: DimensionCode;
  dimension: AuditDimensionResult | null | undefined;
}

function ChecklistRow({ item, result }: { item: ReturnType<typeof getItemsByDimension>[0]; result?: AIItemResult }) {
  const [open, setOpen] = useState(false);
  const statusFromResult = result?.status as string | undefined;
  const combinedStatus = statusFromResult || undefined;
  const hasDetails = result?.finding || result?.recommendation;

  return (
    <>
      <tr
        className={cn('border-b hover:bg-gray-50 cursor-pointer', open && 'bg-gray-50')}
        onClick={() => hasDetails && setOpen(o => !o)}
      >
        <td className="py-2 px-3 w-8">
          {hasDetails ? (open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : null}
        </td>
        <td className="py-2 px-3">
          <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
        </td>
        <td className="py-2 px-3">
          <span className="text-sm">{item.label}</span>
        </td>
        <td className="py-2 px-3">
          <StatusPill status={combinedStatus as 'PASS' | 'FAIL' | 'PARTIAL' | 'NA' | null} />
        </td>
        <td className="py-2 px-3">
          {item.dataSource && <DataSourceTag source={item.dataSource} />}
        </td>
        <td className="py-2 px-3 text-right">
          {result?.priority && (
            <span className={cn('text-xs font-medium',
              result.priority === 'critical' ? 'text-red-600' :
              result.priority === 'high' ? 'text-orange-500' :
              result.priority === 'medium' ? 'text-amber-500' : 'text-gray-400'
            )}>
              {result.priority}
            </span>
          )}
        </td>
      </tr>
      {open && hasDetails && (
        <tr className="bg-gray-50 border-b">
          <td colSpan={6} className="py-3 px-10 space-y-2">
            {result.finding && (
              <p className="text-sm text-gray-700"><span className="font-medium">Finding: </span>{result.finding}</p>
            )}
            {result.recommendation && (
              <p className="text-sm text-blue-700"><span className="font-medium">Action: </span>{result.recommendation}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function ChecklistTable({ dimensionCode, dimension }: ChecklistTableProps) {
  const items = getItemsByDimension(dimensionCode);
  const findings = dimension?.aiFindings as unknown as AIDimensionOutput | undefined;
  const aiItems = findings?.items || [];

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Checklist ({items.length} items)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-muted-foreground">
              <th className="py-2 px-3 w-8" />
              <th className="py-2 px-3 text-left">Code</th>
              <th className="py-2 px-3 text-left">Item</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Source</th>
              <th className="py-2 px-3 text-right">Priority</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const result = aiItems.find(r => r.code === item.code);
              return <ChecklistRow key={item.code} item={item} result={result} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

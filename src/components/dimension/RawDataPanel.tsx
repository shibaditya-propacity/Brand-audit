'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';

interface RawDataPanelProps {
  data: unknown;
  label?: string;
}

export function RawDataPanel({ data, label = 'Raw API Data' }: RawDataPanelProps) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Code2 className="h-4 w-4 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <span className="ml-auto">{open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <pre className="p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

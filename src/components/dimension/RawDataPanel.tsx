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
    <div className="rounded-lg border bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Code2 className="h-4 w-4 text-muted-foreground" />
        {label}
        <span className="ml-auto">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>
      {open && (
        <div className="border-t">
          <pre className="p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto bg-gray-50 text-gray-800">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'collecting' | 'analyzing' | 'done' | 'error';

interface RerunButtonProps {
  auditId: string;
  dimensionCode: string; // 'D1' … 'D10'
  onComplete?: () => void;
}

interface ProgressEvent {
  stage: 'collecting' | 'analyzing' | 'complete' | 'error';
  source?: string;
  status?: 'in_progress' | 'done' | 'failed';
  dimension?: string;
  score?: number | null;
  message?: string;
}

export function RerunButton({ auditId, dimensionCode, onComplete }: RerunButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusLine, setStatusLine] = useState('');
  const esRef = useRef<EventSource | null>(null);

  function start() {
    if (phase !== 'idle' && phase !== 'done' && phase !== 'error') return;

    setPhase('collecting');
    setStatusLine('Starting…');

    const es = new EventSource(`/api/audit/${auditId}/rerun?dimension=${dimensionCode}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as ProgressEvent;

        if (data.stage === 'collecting') {
          if (data.source && data.status === 'in_progress') {
            setStatusLine(`Collecting ${data.source}…`);
          }
        } else if (data.stage === 'analyzing') {
          setPhase('analyzing');
          setStatusLine(`Analyzing ${data.dimension}…`);
        } else if (data.stage === 'complete') {
          setPhase('done');
          setStatusLine(data.score != null ? `Score: ${data.score}` : 'Done');
          es.close();
          onComplete?.();
          // Reset to idle after 3 s so button is reusable
          setTimeout(() => { setPhase('idle'); setStatusLine(''); }, 3000);
        } else if (data.stage === 'error') {
          setPhase('error');
          setStatusLine(data.message ?? 'Error');
          es.close();
          setTimeout(() => { setPhase('idle'); setStatusLine(''); }, 4000);
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setPhase('error');
      setStatusLine('Connection lost');
      es.close();
      setTimeout(() => { setPhase('idle'); setStatusLine(''); }, 4000);
    };
  }

  const running = phase === 'collecting' || phase === 'analyzing';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={start}
        disabled={running}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          running
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : phase === 'done'
            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : phase === 'error'
            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        )}
        title={`Re-run ${dimensionCode} analysis`}
      >
        {running ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : phase === 'done' ? (
          <CheckCircle className="h-3 w-3" />
        ) : phase === 'error' ? (
          <XCircle className="h-3 w-3" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        {running ? (phase === 'collecting' ? 'Collecting…' : 'Analyzing…') : phase === 'done' ? 'Done' : phase === 'error' ? 'Failed' : 'Rerun'}
      </button>

      {statusLine && (
        <span className="text-xs text-muted-foreground truncate max-w-[160px]">{statusLine}</span>
      )}
    </div>
  );
}

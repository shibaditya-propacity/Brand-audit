'use client';
import { useEffect, useRef } from 'react';
import { useAuditStore } from '@/store/auditStore';
import { CheckCircle, XCircle, Loader2, Circle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressEvent } from '@/types/audit';

interface AuditProgressProps {
  auditId: string;
  onComplete?: () => void;
}

function EventRow({ event }: { event: ProgressEvent }) {
  const label = event.stage === 'collecting'
    ? `Collecting: ${event.source}`
    : event.stage === 'analyzing'
    ? `Analyzing: ${event.dimension}`
    : event.stage === 'complete'
    ? `Complete — Score: ${event.overallScore ?? 'N/A'}`
    : event.message || event.stage;

  // Collecting failures use WifiOff (data unavailable, not a crash)
  const isCollectFail = event.stage === 'collecting' && event.status === 'failed';
  const isHardFail = (event.status === 'failed' && event.stage !== 'collecting') || event.stage === 'error';

  const icon =
    event.status === 'done' || event.stage === 'complete'
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : isCollectFail
      ? <WifiOff className="h-4 w-4 text-amber-500" />
      : isHardFail
      ? <XCircle className="h-4 w-4 text-red-500" />
      : event.status === 'in_progress'
      ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      : <Circle className="h-4 w-4 text-gray-400" />;

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      {icon}
      <span className={cn(
        isCollectFail ? 'text-amber-600 dark:text-amber-400' :
        isHardFail ? 'text-red-600' :
        event.stage === 'complete' ? 'text-green-600 font-semibold' :
        'text-slate-700 dark:text-slate-300'
      )}>
        {label}
      </span>
      {isCollectFail && (
        <span className="ml-auto text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
          unavailable
        </span>
      )}
      {event.score !== undefined && event.score !== null && (
        <span className="ml-auto font-medium">{event.score}</span>
      )}
    </div>
  );
}

/** Banner shown after collection phase listing any failed sources */
function FailedSourcesBanner({ failedSources }: { failedSources: string[] }) {
  if (!failedSources.length) return null;
  return (
    <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
      <WifiOff className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        <strong>Partial data:</strong> {failedSources.join(', ')} could not be reached.
        Affected checklist items will be marked N/A — no score penalty applied.
      </span>
    </div>
  );
}

export function AuditProgress({ auditId, onComplete }: AuditProgressProps) {
  const { progressEvents, isRunning, addProgressEvent, setIsRunning } = useAuditStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);

  // Accumulate failed sources from events
  const failedSources = progressEvents
    .filter(e => e.stage === 'collecting' && e.status === 'failed' && e.source)
    .map(e => e.source as string);

  useEffect(() => {
    if (isRunning || completedRef.current) return;
    setIsRunning(true);

    const es = new EventSource(`/api/audit/${auditId}/run`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as ProgressEvent;
        addProgressEvent(data);
        if (data.stage === 'complete' || data.stage === 'error') {
          completedRef.current = true;
          es.close();
          setIsRunning(false);
          onComplete?.();
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      addProgressEvent({ stage: 'error', message: 'Connection lost' });
      es.close();
      setIsRunning(false);
    };

    return () => { es.close(); };
  }, [auditId]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="flex items-center gap-2 mb-3">
        {isRunning && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          {isRunning ? 'Running Audit...' : 'Audit Progress'}
        </h3>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-0.5">
        {progressEvents.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Starting...</p>
        )}
        {progressEvents.map((event, idx) => (
          <EventRow key={idx} event={event} />
        ))}
      </div>
      <FailedSourcesBanner failedSources={failedSources} />
    </div>
  );
}

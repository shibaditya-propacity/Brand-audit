'use client';
import { useEffect, useRef } from 'react';
import { useAuditStore } from '@/store/auditStore';
import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';
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
    ? `Complete — Score: ${event.overallScore}`
    : event.message || event.stage;

  const icon =
    event.status === 'done' || event.stage === 'complete' ? <CheckCircle className="h-4 w-4 text-green-500" /> :
    event.status === 'failed' || event.stage === 'error' ? <XCircle className="h-4 w-4 text-red-500" /> :
    event.status === 'in_progress' ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" /> :
    <Circle className="h-4 w-4 text-gray-400" />;

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      {icon}
      <span className={cn(
        event.status === 'failed' || event.stage === 'error' ? 'text-red-600' :
        event.stage === 'complete' ? 'text-green-700 font-semibold' : 'text-gray-700'
      )}>{label}</span>
      {event.score !== undefined && <span className="ml-auto font-medium">{event.score}</span>}
    </div>
  );
}

export function AuditProgress({ auditId, onComplete }: AuditProgressProps) {
  const { progressEvents, isRunning, addProgressEvent, setIsRunning } = useAuditStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);

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
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        {isRunning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        <h3 className="font-semibold text-sm">
          {isRunning ? 'Running Audit...' : 'Audit Progress'}
        </h3>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-0.5">
        {progressEvents.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Starting...</p>
        )}
        {progressEvents.map((event, idx) => (
          <EventRow key={idx} event={event} />
        ))}
      </div>
    </div>
  );
}

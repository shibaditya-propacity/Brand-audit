'use client';
import { useCallback } from 'react';
import { useAuditStore } from '@/store/auditStore';
import type { ProgressEvent } from '@/types/audit';

export function useRunAnalysis(auditId: string) {
  const { addProgressEvent, setIsRunning, clearProgressEvents } = useAuditStore();

  const startAnalysis = useCallback(async () => {
    setIsRunning(true);
    clearProgressEvents();

    const eventSource = new EventSource(`/api/audit/${auditId}/run`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressEvent;
        addProgressEvent(data);
        if (data.stage === 'complete' || data.stage === 'error') {
          eventSource.close();
          setIsRunning(false);
        }
      } catch { /* ignore parse errors */ }
    };

    eventSource.onerror = () => {
      addProgressEvent({ stage: 'error', message: 'Connection lost' });
      eventSource.close();
      setIsRunning(false);
    };

    return () => {
      eventSource.close();
      setIsRunning(false);
    };
  }, [auditId, addProgressEvent, setIsRunning, clearProgressEvents]);

  return { startAnalysis };
}

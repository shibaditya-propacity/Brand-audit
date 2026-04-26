'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditStore } from '@/store/auditStore';
import { CheckCircle, XCircle, Loader2, WifiOff, RefreshCw, Database, Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressEvent } from '@/types/audit';

interface AuditProgressProps {
  auditId: string;
  onComplete?: () => void;
  autoRun?: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  PDL:             'Company Data',
  DataForSEO:      'SEO Data',
  WebCrawler:      'Website',
  HikerAPI:        'Social Media',
  MetaAdLibrary:   'Ad Library',
  Reviews:         'Reviews',
  Screenshot:      'Screenshot',
  PromoterLinkedIn:'LinkedIn Profile',
};

/* ── single log row ── */
function EventRow({ event, index }: { event: ProgressEvent; index: number }) {
  const rawSource = event.source ?? 'data source';
  const label =
    event.stage === 'collecting'
      ? (SOURCE_LABELS[rawSource] ?? rawSource)
      : event.stage === 'analyzing'
      ? (event.dimension ?? 'dimension')
      : event.stage === 'complete'
      ? `Done — Score: ${event.overallScore ?? 'N/A'}`
      : event.message || event.stage;

  const isCollectFail = event.stage === 'collecting' && event.status === 'failed';
  const isHardFail    = (event.status === 'failed' && event.stage !== 'collecting') || event.stage === 'error';
  const isDone        = event.status === 'done' || event.stage === 'complete';
  const isInProgress  = event.status === 'in_progress';

  const icon = isDone ? (
    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
  ) : isCollectFail ? (
    <WifiOff className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
  ) : isHardFail ? (
    <XCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
  ) : isInProgress ? (
    <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin flex-shrink-0" />
  ) : (
    <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0 inline-block" />
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
        isDone        && 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
        isCollectFail && 'bg-amber-500/5  text-amber-700  dark:text-amber-400',
        isHardFail    && 'bg-rose-500/5   text-rose-700   dark:text-rose-400',
        isInProgress  && 'bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
        !isDone && !isCollectFail && !isHardFail && !isInProgress && 'text-slate-500 dark:text-slate-500',
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {isCollectFail && (
        <span className="ml-auto text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
          unavailable
        </span>
      )}
      {event.score !== undefined && event.score !== null && (
        <span className="ml-auto font-bold text-indigo-600 dark:text-indigo-400">{event.score}</span>
      )}
    </motion.div>
  );
}

/* ── phase progress bar ── */
function PhaseBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums w-10 text-right">
        {done}/{total}
      </span>
    </div>
  );
}

/* ── failed sources banner ── */
function FailedSourcesBanner({ sources }: { sources: string[] }) {
  if (!sources.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 text-xs text-amber-700 dark:text-amber-400"
    >
      <WifiOff className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        <strong>Partial data:</strong> {sources.map(s => SOURCE_LABELS[s] ?? s).join(', ')} could not be reached.
        Affected items will be marked N/A — no score penalty applied.
      </span>
    </motion.div>
  );
}

export function AuditProgress({ auditId, onComplete, autoRun = false }: AuditProgressProps) {
  const { progressEvents, isRunning, addProgressEvent, clearProgressEvents, setIsRunning } = useAuditStore();
  const eventSourceRef  = useRef<EventSource | null>(null);
  const completedRef    = useRef(false);
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const collectEvents  = progressEvents.filter(e => e.stage === 'collecting');
  const analyzeEvents  = progressEvents.filter(e => e.stage === 'analyzing');
  const failedSources  = collectEvents.filter(e => e.status === 'failed').map(e => e.source as string);
  const doneSources    = collectEvents.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalSources   = collectEvents.length;
  const doneDims       = analyzeEvents.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalDims      = analyzeEvents.length;

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [progressEvents.length]);

  function startRun() {
    if (isRunning || completedRef.current) return;
    clearProgressEvents();
    setIsRunning(true);
    setManuallyStarted(true);

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
      es.close();
      if (completedRef.current) return;
      addProgressEvent({ stage: 'error', message: 'Connection lost — checking status…' });
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/audit/${auditId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'COMPLETE') {
            clearInterval(poll);
            completedRef.current = true;
            setIsRunning(false);
            addProgressEvent({ stage: 'complete', overallScore: data.overallScore });
            onComplete?.();
          } else if (data.status === 'FAILED') {
            clearInterval(poll);
            completedRef.current = true;
            setIsRunning(false);
            addProgressEvent({ stage: 'error', message: 'Audit failed on server' });
          }
        } catch { /* keep polling */ }
      }, 4000);
    };
  }

  useEffect(() => {
    if (autoRun) startRun();
    return () => { eventSourceRef.current?.close(); };
  }, [auditId]);

  /* ── Resume prompt ── */
  if (!autoRun && !manuallyStarted && !isRunning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-200/70 dark:border-amber-700/40 bg-amber-50/80 dark:bg-amber-900/15 p-5 flex items-center gap-4 backdrop-blur-sm"
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Audit is incomplete</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
            A previous run did not finish. Click Resume to re-run the analysis.
          </p>
        </div>
        <button
          onClick={startRun}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-md shadow-amber-500/20 flex-shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Resume
        </button>
      </motion.div>
    );
  }

  const completeEvent = progressEvents.find(e => e.stage === 'complete');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {isRunning ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
          </span>
        ) : completeEvent ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          {isRunning ? 'Running Audit…' : completeEvent ? 'Audit Complete' : 'Audit Progress'}
        </h3>
        {isRunning && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-mono animate-blink">●</span>
        )}
        {completeEvent?.overallScore !== undefined && (
          <span className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Score: {completeEvent.overallScore ?? 'N/A'}
          </span>
        )}
      </div>

      {/* Phase progress bars */}
      {(totalSources > 0 || totalDims > 0) && (
        <div className="px-4 pt-3 pb-2 space-y-2.5">
          {totalSources > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-3 w-3 text-blue-500" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Data Collection
                </span>
              </div>
              <PhaseBar done={doneSources} total={totalSources} color="bg-blue-500" />
            </div>
          )}
          {totalDims > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="h-3 w-3 text-violet-500" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  AI Analysis
                </span>
              </div>
              <PhaseBar done={doneDims} total={totalDims} color="bg-violet-500" />
            </div>
          )}
        </div>
      )}

      {/* Log */}
      <div
        ref={logRef}
        className="max-h-72 overflow-y-auto px-3 py-2 space-y-0.5 scroll-smooth"
      >
        {progressEvents.length === 0 && (
          <div className="flex items-center gap-2 py-3 px-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Initialising…
          </div>
        )}
        <AnimatePresence initial={false}>
          {progressEvents.map((event, idx) => (
            <EventRow key={idx} event={event} index={idx} />
          ))}
        </AnimatePresence>
      </div>

      <FailedSourcesBanner sources={failedSources} />
    </motion.div>
  );
}

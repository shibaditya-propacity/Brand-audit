'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditStore } from '@/store/auditStore';
import { CheckCircle, WifiOff, RefreshCw, Database, Cpu, Sparkles, TrendingUp, Building2, MapPin, IndianRupee, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressEvent } from '@/types/audit';

const FACTS = [
  { icon: IndianRupee, color: 'text-emerald-500', tag: 'Market Size', fact: 'India\'s real estate sector is expected to reach $1 trillion by 2030, contributing 13% of the country\'s GDP.' },
  { icon: Building2, color: 'text-blue-500', tag: 'Housing Demand', fact: 'India needs to build 25 million affordable urban homes by 2030 to meet the demand of its growing middle class.' },
  { icon: TrendingUp, color: 'text-violet-500', tag: 'Investment', fact: 'Real estate attracts the second-highest FDI in India after the services sector, crossing $55 billion in the last decade.' },
  { icon: MapPin, color: 'text-rose-500', tag: 'Top Cities', fact: 'Mumbai, Delhi NCR, and Bengaluru together account for over 60% of India\'s Grade-A office space absorption every year.' },
  { icon: BarChart3, color: 'text-amber-500', tag: 'Digital Shift', fact: 'Over 70% of homebuyers now start their property search online, making digital brand presence critical for developers.' },
  { icon: Building2, color: 'text-indigo-500', tag: 'Luxury Boom', fact: 'Luxury home sales (₹4 Cr+) in India surged 130% between 2021 and 2024 — the fastest-growing segment in the market.' },
  { icon: IndianRupee, color: 'text-teal-500', tag: 'RERA Impact', fact: 'RERA has registered over 1.2 lakh real estate projects across India, boosting buyer confidence and accountability.' },
  { icon: TrendingUp, color: 'text-orange-500', tag: 'NRI Interest', fact: 'NRIs invested over $13.1 billion in Indian real estate in 2023, with the US, UAE, and UK being the top source countries.' },
  { icon: MapPin, color: 'text-cyan-500', tag: 'Tier-2 Rise', fact: 'Tier-2 cities like Pune, Hyderabad, and Ahmedabad saw a 40% jump in new residential launches in 2023 vs 2021.' },
  { icon: BarChart3, color: 'text-pink-500', tag: 'Office Rebound', fact: 'India\'s office market absorbed a record 60+ million sq ft in 2023 — surpassing pre-pandemic levels for the first time.' },
  { icon: Building2, color: 'text-lime-500', tag: 'Green Building', fact: 'India is the 3rd largest green building market globally, with over 10 billion sq ft of green-certified space registered.' },
  { icon: IndianRupee, color: 'text-sky-500', tag: 'Rental Yields', fact: 'Residential rental yields in Indian metro cities average 2–4%, while commercial properties can yield 7–10% annually.' },
  { icon: TrendingUp, color: 'text-fuchsia-500', tag: 'Brand Power', fact: 'Branded developers command a 15–25% price premium over local builders in the same micro-market, per industry studies.' },
  { icon: MapPin, color: 'text-red-500', tag: 'PropTech', fact: 'India\'s PropTech market is projected to grow to $1 billion by 2030, reshaping how developers market and sell homes.' },
  { icon: BarChart3, color: 'text-yellow-500', tag: 'Social Media', fact: 'Instagram and YouTube are the #1 channels for luxury real estate discovery in India among buyers aged 28–45.' },
];

function FactRotator({ visible }: { visible: boolean }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % FACTS.length);
        setShow(true);
      }, 400);
    }, 20000);
    return () => clearInterval(interval);
  }, [visible]);

  const fact = FACTS[idx];
  const Icon = fact.icon;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="px-4 py-5"
        >
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0', fact.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn('inline-block text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800', fact.color)}>
                {fact.tag}
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {fact.fact}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              {FACTS.slice(0, 8).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors duration-500',
                    i === idx % 8 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{idx + 1}/{FACTS.length}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

  const collectEvents  = progressEvents.filter(e => e.stage === 'collecting');
  const analyzeEvents  = progressEvents.filter(e => e.stage === 'analyzing');
  const failedSources  = collectEvents.filter(e => e.status === 'failed').map(e => e.source as string);
  const doneSources    = collectEvents.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalSources   = collectEvents.length;
  const doneDims       = analyzeEvents.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalDims      = analyzeEvents.length;

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

      {/* Facts while running, completion card when done */}
      {isRunning || progressEvents.length === 0 ? (
        <div>
          {progressEvents.length === 0 && (
            <div className="flex items-center gap-2 px-4 pt-4 pb-1 text-xs text-slate-400 dark:text-slate-500">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Initialising audit…</span>
            </div>
          )}
          <div className="border-t border-slate-100 dark:border-slate-800">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Did you know?
              </p>
            </div>
            <FactRotator visible={isRunning || progressEvents.length === 0} />
          </div>
        </div>
      ) : null}

      <FailedSourcesBanner sources={failedSources} />
    </motion.div>
  );
}

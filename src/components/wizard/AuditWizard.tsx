'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuditStore } from '@/store/auditStore';
import { Step1BrandDetails } from './Step1BrandDetails';
import { Step2DigitalPresence } from './Step2DigitalPresence';
import { Step3Collateral } from './Step3Collateral';
import { Step4Confirm } from './Step4Confirm';
import { BrandPrefillStep } from './BrandPrefillStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, Database, Brain, Rocket, Sparkles } from 'lucide-react';
import type { ProgressEvent } from '@/types/audit';

const STEPS = [
  { num: 1, label: 'Brand Details' },
  { num: 2, label: 'Digital Presence' },
  { num: 3, label: 'Market & Tech' },
  { num: 4, label: 'Review & Launch' },
];

const COLLECTION_SOURCES = ['PDL', 'DataForSEO', 'WebCrawler', 'HikerAPI', 'MetaAdLibrary', 'Screenshot', 'GooglePlaces'];
const DIMENSION_CODES = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'];

function AnalysisScreen({ auditId, onDone }: { auditId: string; onDone: () => void }) {
  const { addProgressEvent, clearProgressEvents, progressEvents, setIsRunning } = useAuditStore();
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  const collecting = progressEvents.filter(e => e.stage === 'collecting' && e.source);
  const analyzing = progressEvents.filter(e => e.stage === 'analyzing' && e.dimension);
  const isComplete = progressEvents.some(e => e.stage === 'complete');
  const hasError = progressEvents.some(e => e.stage === 'error');
  const currentStageMsg = progressEvents.filter(e => e.message).at(-1)?.message ?? 'Initializing...';

  const collectDone = collecting.filter(e => e.status === 'done' || e.status === 'failed').length;
  const analyzeDone = analyzing.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalProgress = isComplete ? 100
    : collecting.length === 0 ? 5
    : Math.round(5 + (collectDone / COLLECTION_SOURCES.length) * 35 + (analyzeDone / DIMENSION_CODES.length) * 60);

  useEffect(() => {
    clearProgressEvents();
    setIsRunning(true);
    const es = new EventSource(`/api/audit/${auditId}/run`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as ProgressEvent;
        addProgressEvent(data);
        if ((data.stage === 'complete' || data.stage === 'error') && !doneRef.current) {
          doneRef.current = true;
          es.close();
          setIsRunning(false);
          if (data.stage === 'complete') setTimeout(onDone, 1200);
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      if (!doneRef.current) {
        addProgressEvent({ stage: 'error', message: 'Connection lost' });
        es.close();
        setIsRunning(false);
      }
    };

    return () => { es.close(); };
  }, [auditId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Icon + title */}
        <div className="text-center space-y-2">
          {isComplete ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          ) : hasError ? (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-6 w-6 text-primary animate-pulse" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {isComplete ? 'Audit Complete!' : hasError ? 'Something went wrong' : 'Running Audit…'}
          </h2>
          <p className="text-sm text-muted-foreground">{isComplete ? 'Redirecting to your report…' : currentStageMsg}</p>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Two-column stage tracker */}
        <div className="grid grid-cols-2 gap-6">
          {/* Collection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              Data Collection
            </div>
            {COLLECTION_SOURCES.map(src => {
              const ev = collecting.find(e => e.source === src);
              const status = ev?.status ?? 'pending';
              return (
                <div key={src} className="flex items-center gap-2 text-sm">
                  {status === 'done' ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    : status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    : status === 'in_progress' ? <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
                    : <div className="h-3.5 w-3.5 rounded-full border border-gray-200 flex-shrink-0" />}
                  <span className={cn('truncate', status === 'pending' ? 'text-gray-400' : status === 'failed' ? 'text-red-500' : 'text-gray-700')}>
                    {src}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Brain className="h-3.5 w-3.5" />
              AI Analysis
            </div>
            {DIMENSION_CODES.map(dim => {
              const ev = analyzing.find(e => e.dimension === dim);
              const status = ev?.status ?? 'pending';
              return (
                <div key={dim} className="flex items-center gap-2 text-sm">
                  {status === 'done' ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    : status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    : status === 'in_progress' ? <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
                    : <div className="h-3.5 w-3.5 rounded-full border border-gray-200 flex-shrink-0" />}
                  <span className={cn('truncate', status === 'pending' ? 'text-gray-400' : status === 'failed' ? 'text-red-500' : 'text-gray-700')}>
                    {dim}
                    {ev?.score !== undefined && ev?.score !== null && status === 'done' && (
                      <span className="ml-1 text-xs text-muted-foreground">· {ev.score}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {hasError && (
          <p className="text-center text-sm text-red-600">
            Analysis encountered errors. Some dimensions may have incomplete data.{' '}
            <button className="underline" onClick={onDone}>View partial report →</button>
          </p>
        )}
      </div>
    </div>
  );
}

export function AuditWizard() {
  const router = useRouter();
  const { wizard, setWizardStep, resetWizard } = useAuditStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingAuditId, setAnalyzingAuditId] = useState<string | null>(null);
  // showPrefill: true = show the Brand Prefill screen between step 1 and step 2
  const [showPrefill, setShowPrefill] = useState(false);
  const step = wizard.currentStep;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developer: wizard.formData, ...wizard.auditMeta }),
      });
      if (!res.ok) throw new Error('Failed to create audit');
      const audit = await res.json();
      resetWizard();
      setAnalyzingAuditId(audit._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  if (analyzingAuditId) {
    return (
      <AnalysisScreen
        auditId={analyzingAuditId}
        onDone={() => router.push(`/audit/${analyzingAuditId}`)}
      />
    );
  }

  // Prefill screen shown between step 1 and step 2
  if (showPrefill) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Stepper — step 1 shown as active during prefill */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0',
                s.num === 1 ? 'bg-primary text-white' :
                step > s.num ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'
              )}>
                {s.num === 1 ? <Sparkles className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn('text-sm hidden sm:block', s.num === 1 ? 'text-primary font-medium' : 'text-muted-foreground')}>
                {s.num === 1 ? 'Quick Lookup' : s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Brand Quick Lookup</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              We found this data publicly. Review, edit, or clear any field before continuing.
            </p>
          </div>
          <BrandPrefillStep
            onContinue={() => { setShowPrefill(false); setWizardStep(2); }}
            onBack={() => setShowPrefill(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0',
              step === s.num ? 'bg-primary text-white' :
              step > s.num ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'
            )}>
              {s.num}
            </div>
            <span className={cn('text-sm hidden sm:block', step === s.num ? 'text-primary font-medium' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border bg-white p-6">
        {step === 1 && <Step1BrandDetails />}
        {step === 2 && <Step2DigitalPresence />}
        {step === 3 && <Step3Collateral />}
        {step === 4 && <Step4Confirm />}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setWizardStep(step - 1) : router.push('/')}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => {
                // After step 1, show prefill if brand name is set
                if (step === 1 && wizard.formData.brandName) {
                  setShowPrefill(true);
                } else {
                  setWizardStep(step + 1);
                }
              }}
            >
              Next →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Launch Audit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

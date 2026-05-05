'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditStore } from '@/store/auditStore';
import { Step1BrandDetails } from './Step1BrandDetails';
import { Step2DigitalPresence } from './Step2DigitalPresence';
import { Step3Collateral } from './Step3Collateral';
import { Step4Confirm } from './Step4Confirm';
import { BrandPrefillStep } from './BrandPrefillStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, Database, Brain, Rocket, Sparkles, TrendingUp, Building2, MapPin, IndianRupee, BarChart3 } from 'lucide-react';
import type { ProgressEvent } from '@/types/audit';

const STEPS = [
  { num: 1, label: 'Brand Details' },
  { num: 2, label: 'Digital Presence' },
  { num: 3, label: 'Market & Tech' },
  { num: 4, label: 'Review & Launch' },
];

const COLLECTION_SOURCES = ['PDL', 'DataForSEO', 'WebCrawler', 'HikerAPI', 'MetaAdLibrary', 'Screenshot', 'GooglePlaces'];
const DIMENSION_CODES = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'];

const FACTS = [
  { icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50', tag: 'Market Size', fact: "India's real estate sector is expected to reach $1 trillion by 2030, contributing 13% of the country's GDP." },
  { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', tag: 'Housing Demand', fact: 'India needs to build 25 million affordable urban homes by 2030 to meet the demand of its growing middle class.' },
  { icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50', tag: 'Investment', fact: 'Real estate attracts the second-highest FDI in India after the services sector, crossing $55 billion in the last decade.' },
  { icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-50', tag: 'Top Cities', fact: "Mumbai, Delhi NCR, and Bengaluru together account for over 60% of India's Grade-A office space absorption every year." },
  { icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50', tag: 'Digital Shift', fact: 'Over 70% of homebuyers now start their property search online, making digital brand presence critical for developers.' },
  { icon: Building2, color: 'text-primary', bg: 'bg-primary/5', tag: 'Luxury Boom', fact: 'Luxury home sales (₹4 Cr+) in India surged 130% between 2021 and 2024 — the fastest-growing segment in the market.' },
  { icon: IndianRupee, color: 'text-teal-500', bg: 'bg-teal-50', tag: 'RERA Impact', fact: 'RERA has registered over 1.2 lakh real estate projects across India, boosting buyer confidence and accountability.' },
  { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', tag: 'NRI Interest', fact: 'NRIs invested over $13.1 billion in Indian real estate in 2023, with the US, UAE, and UK being the top source countries.' },
  { icon: MapPin, color: 'text-cyan-500', bg: 'bg-cyan-50', tag: 'Tier-2 Rise', fact: 'Tier-2 cities like Pune, Hyderabad, and Ahmedabad saw a 40% jump in new residential launches in 2023 vs 2021.' },
  { icon: BarChart3, color: 'text-pink-500', bg: 'bg-pink-50', tag: 'Office Rebound', fact: "India's office market absorbed a record 60+ million sq ft in 2023 — surpassing pre-pandemic levels for the first time." },
  { icon: Building2, color: 'text-lime-600', bg: 'bg-lime-50', tag: 'Green Building', fact: 'India is the 3rd largest green building market globally, with over 10 billion sq ft of green-certified space registered.' },
  { icon: IndianRupee, color: 'text-sky-500', bg: 'bg-sky-50', tag: 'Rental Yields', fact: 'Residential rental yields in Indian metro cities average 2–4%, while commercial properties can yield 7–10% annually.' },
  { icon: TrendingUp, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', tag: 'Brand Power', fact: 'Branded developers command a 15–25% price premium over local builders in the same micro-market, per industry studies.' },
  { icon: MapPin, color: 'text-red-500', bg: 'bg-red-50', tag: 'PropTech', fact: "India's PropTech market is projected to grow to $1 billion by 2030, reshaping how developers market and sell homes." },
  { icon: BarChart3, color: 'text-yellow-600', bg: 'bg-yellow-50', tag: 'Social Media', fact: 'Instagram and YouTube are the #1 channels for luxury real estate discovery in India among buyers aged 28–45.' },
];

function FactCard() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % FACTS.length); setVisible(true); }, 400);
    }, 20000);
    return () => clearInterval(iv);
  }, []);

  const f = FACTS[idx];
  const Icon = f.icon;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Did you know?</p>
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-xl flex-shrink-0', f.bg)}>
              <Icon className={cn('h-5 w-5', f.color)} />
            </div>
            <div>
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', f.color)}>{f.tag}</span>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{f.fact}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-1">
            {FACTS.map((_, i) => (
              <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-all duration-500', i === idx ? f.color.replace('text-', 'bg-') : 'bg-gray-200')} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnalysisScreen({ auditId, onDone }: { auditId: string; onDone: () => void }) {
  const { addProgressEvent, clearProgressEvents, progressEvents, setIsRunning } = useAuditStore();
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  const collecting = progressEvents.filter(e => e.stage === 'collecting' && e.source);
  const analyzing = progressEvents.filter(e => e.stage === 'analyzing' && e.dimension);
  const isComplete = progressEvents.some(e => e.stage === 'complete');
  const hasError = progressEvents.some(e => e.stage === 'error');

  const collectDone = collecting.filter(e => e.status === 'done' || e.status === 'failed').length;
  const analyzeDone = analyzing.filter(e => e.status === 'done' || e.status === 'failed').length;
  const totalProgress = isComplete ? 100
    : collecting.length === 0 ? 5
    : Math.round(5 + (collectDone / COLLECTION_SOURCES.length) * 35 + (analyzeDone / DIMENSION_CODES.length) * 60);

  const phase = isComplete ? 'Done' : analyzing.length > 0 ? 'Analysing brand dimensions…' : collecting.length > 0 ? 'Gathering data from the web…' : 'Starting up…';

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
      <div className="w-full max-w-md space-y-6">

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
            {isComplete ? 'Audit Complete!' : hasError ? 'Something went wrong' : 'Running Brand Audit…'}
          </h2>
          <p className="text-sm text-muted-foreground">{isComplete ? 'Redirecting to your report…' : phase}</p>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Phase mini-bars */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              <Database className="h-3 w-3" /> Data Collection
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                animate={{ width: `${COLLECTION_SOURCES.length > 0 ? Math.round((collectDone / COLLECTION_SOURCES.length) * 100) : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[11px] text-gray-400">{collectDone} of {COLLECTION_SOURCES.length} sources</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              <Brain className="h-3 w-3" /> AI Analysis
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500 rounded-full"
                animate={{ width: `${DIMENSION_CODES.length > 0 ? Math.round((analyzeDone / DIMENSION_CODES.length) * 100) : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[11px] text-gray-400">{analyzeDone} of {DIMENSION_CODES.length} dimensions</p>
          </div>
        </div>

        {/* Rotating fact card */}
        {!isComplete && !hasError && <FactCard />}

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

      // Existing complete audit found — skip analysis and go straight to report
      if (audit.existing) {
        router.push(`/audit/${audit._id}`);
        return;
      }

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

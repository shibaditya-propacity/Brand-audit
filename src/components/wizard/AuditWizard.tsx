'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuditStore } from '@/store/auditStore';
import { Step1BrandDetails } from './Step1BrandDetails';
import { Step2DigitalPresence } from './Step2DigitalPresence';
import { Step3Collateral } from './Step3Collateral';
import { Step4Confirm } from './Step4Confirm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Brand Details' },
  { num: 2, label: 'Digital Presence' },
  { num: 3, label: 'Market & Tech' },
  { num: 4, label: 'Review & Launch' },
];

export function AuditWizard() {
  const router = useRouter();
  const { wizard, setWizardStep, resetWizard } = useAuditStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = wizard.currentStep;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developer: wizard.formData,
          ...wizard.auditMeta,
        }),
      });
      if (!res.ok) throw new Error('Failed to create audit');
      const audit = await res.json();
      resetWizard();
      router.push(`/audit/${audit._id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
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
            <Button onClick={() => setWizardStep(step + 1)}>
              Next →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating Audit...' : 'Launch Audit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

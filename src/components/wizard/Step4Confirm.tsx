'use client';
import { useAuditStore } from '@/store/auditStore';
import { Check } from 'lucide-react';

export function Step4Confirm() {
  const { wizard } = useAuditStore();
  const d = wizard.formData;
  const m = wizard.auditMeta;

  const sections = [
    { label: 'Brand Name', value: d.brandName },
    { label: 'Domain', value: d.domain },
    { label: 'Website', value: d.websiteUrl },
    { label: 'City', value: d.city },
    { label: 'Positioning', value: d.positioning },
    { label: 'Instagram', value: d.instagramHandle },
    { label: 'GMB Place ID', value: d.gmbPlaceId },
    { label: 'Competitors', value: d.competitors?.join(', ') },
    { label: 'RERA Numbers', value: d.reraNumbers?.join(', ') },
    { label: 'Auditor', value: m.auditorName },
    { label: 'Objective', value: m.objective },
  ].filter(s => s.value);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review & Launch</h2>
      <p className="text-sm text-muted-foreground">Confirm the details below before launching the audit. Once launched, data collection will start automatically.</p>
      <div className="rounded-md bg-gray-50 p-4 space-y-2">
        {sections.map(s => (
          <div key={s.label} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground w-32 flex-shrink-0">{s.label}:</span>
            <span className="font-medium text-gray-800 flex-1 break-all">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">Clicking <strong>Launch Audit</strong> will trigger live API calls to Google Places, DataForSEO, Instagram (HikerAPI), Meta Ad Library, and Claude AI. This uses real API credits.</p>
      </div>
    </div>
  );
}

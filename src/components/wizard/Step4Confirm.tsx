'use client';
import { useAuditStore } from '@/store/auditStore';
import { Check, FileText, AlertTriangle } from 'lucide-react';

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
      {/* Collateral docs summary */}
      {d.collateralDocs && d.collateralDocs.length > 0 ? (
        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 space-y-1">
          <p className="text-xs font-medium text-indigo-800 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {d.collateralDocs.length} collateral doc{d.collateralDocs.length > 1 ? 's' : ''} uploaded
          </p>
          {d.collateralDocs.map((doc, i) => (
            <p key={i} className="text-xs text-indigo-700 pl-5">{doc.name}.pdf</p>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            No collateral documents uploaded — collateral analysis will be incomplete.
          </p>
        </div>
      )}

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">Clicking <strong>Launch Audit</strong> will trigger live API calls to Google Places, DataForSEO, Instagram (HikerAPI), Meta Ad Library, and Claude AI. This uses real API credits.</p>
      </div>
    </div>
  );
}

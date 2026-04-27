'use client';
import { ManualInputForm } from '@/components/dimension/ManualInputForm';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import { ExternalLink } from 'lucide-react';

export default function D10Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D10');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const dev = audit?.developer;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D10" dimension={dimension} />
      <ManualInputForm
        dimensionCode="D10"
        auditId={params.auditId}
        initialData={audit?.manualOverrides?.['D10'] as Record<string, unknown> | undefined}
        onSaved={refetch}
      />
    </>
  );

  const cdAny = audit?.collectedData as Record<string, unknown> | null | undefined;
  const promoterLinkedInData = cdAny?.promoterLinkedInData as Record<string, unknown> | null | undefined;

  const rightContent = (
    <>
      {dev && (
        <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Promoter Profile</h3>
          {[
            { label: 'Name', value: dev.promoterName },
            { label: 'LinkedIn', value: dev.promoterLinkedIn, isLink: true },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-20 flex-shrink-0">{f.label}</span>
              {f.isLink ? (
                <a href={String(f.value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  View Profile <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-medium">{String(f.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fetched LinkedIn data card */}
      {promoterLinkedInData ? (
        <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 space-y-2">
          <h3 className="font-semibold text-sm">LinkedIn Profile Data</h3>
          {[
            { label: 'Name', value: promoterLinkedInData.fullName },
            { label: 'Headline', value: promoterLinkedInData.headline },
            { label: 'Followers', value: promoterLinkedInData.followers != null ? String(promoterLinkedInData.followers) : null },
            { label: 'Connections', value: promoterLinkedInData.connections },
            { label: 'Role', value: promoterLinkedInData.currentRole },
            { label: 'Company', value: promoterLinkedInData.currentCompany },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">{f.label}</span>
              <span className="font-medium">{String(f.value)}</span>
            </div>
          ))}
          {promoterLinkedInData.about != null && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
              {String(promoterLinkedInData.about).slice(0, 200)}{String(promoterLinkedInData.about).length > 200 ? '…' : ''}
            </p>
          )}
        </div>
      ) : dev?.promoterLinkedIn ? (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          LinkedIn data not yet collected. Rerun D10 analysis to fetch it.
        </div>
      ) : null}

      <RawDataPanel data={audit?.collectedData?.websiteContent} label="Website Promoter Signals" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D10" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

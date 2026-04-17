'use client';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import { ScoreBadge } from '@/components/shared/ScoreBadge';

export default function D1Page({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D1');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D1" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      {audit?.developer && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <h3 className="font-semibold text-sm">Brand Profile</h3>
          {[
            { label: 'Brand Name', value: audit.developer.brandName },
            { label: 'Legal Name', value: audit.developer.legalName },
            { label: 'City', value: audit.developer.city },
            { label: 'Positioning', value: audit.developer.positioning },
            { label: 'Est.', value: audit.developer.yearEstablished },
            { label: 'Promoter', value: audit.developer.promoterName },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">{f.label}</span>
              <span className="font-medium">{String(f.value)}</span>
            </div>
          ))}
        </div>
      )}
      <RawDataPanel data={audit?.collectedData?.seoKeywords} label="SERP Data (PDL)" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D1" dimension={dimension} leftContent={leftContent} rightContent={rightContent} />
    </AppShell>
  );
}

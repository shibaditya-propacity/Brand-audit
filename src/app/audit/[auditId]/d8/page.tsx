'use client';
import { ManualInputForm } from '@/components/dimension/ManualInputForm';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D8Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D8');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D8" dimension={dimension} />
      <ManualInputForm
        dimensionCode="D8"
        auditId={params.auditId}
        initialData={audit?.manualOverrides?.['D8'] as Record<string, unknown> | undefined}
        onSaved={refetch}
      />
    </>
  );

  const rightContent = (
    <>
      <RawDataPanel data={cd?.technicalSeo} label="Technical SEO / Tech Stack" />
      <RawDataPanel data={cd?.websiteContent} label="Website Technology Signals" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D8" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

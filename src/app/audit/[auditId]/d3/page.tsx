'use client';
import { ManualInputForm } from '@/components/dimension/ManualInputForm';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { SocialStatsWidget } from '@/components/widgets/SocialStatsWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D3Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D3');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D3" dimension={dimension} />
      <ManualInputForm
        dimensionCode="D3"
        auditId={params.auditId}
        initialData={audit?.manualOverrides?.['D3'] as Record<string, unknown> | undefined}
        onSaved={refetch}
      />
    </>
  );

  const cdAny = cd as Record<string, unknown> | undefined;

  const rightContent = (
    <>
      <SocialStatsWidget
        instagramData={cd?.instagramData}
        facebookData={cdAny?.facebookData}
        linkedinData={cdAny?.linkedinData}
      />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D3" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

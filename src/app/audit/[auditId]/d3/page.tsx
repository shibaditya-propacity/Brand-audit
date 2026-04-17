'use client';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { SocialStatsWidget } from '@/components/widgets/SocialStatsWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D3Page({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D3');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D3" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      <SocialStatsWidget instagramData={cd?.instagramData} />
      <RawDataPanel data={cd?.instagramData} label="Instagram Raw Data" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D3" dimension={dimension} leftContent={leftContent} rightContent={rightContent} />
    </AppShell>
  );
}

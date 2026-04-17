'use client';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { ReviewsWidget } from '@/components/widgets/ReviewsWidget';
import { SentimentWidget } from '@/components/widgets/SentimentWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D7Page({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D7');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D7" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      <ReviewsWidget gmbData={cd?.gmbData} />
      <SentimentWidget findings={dimension?.aiFindings} />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D7" dimension={dimension} leftContent={leftContent} rightContent={rightContent} />
    </AppShell>
  );
}

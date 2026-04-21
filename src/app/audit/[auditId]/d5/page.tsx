'use client';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { LogoAuditWidget } from '@/components/widgets/LogoAuditWidget';
import { WebsiteScreenshotWidget } from '@/components/widgets/WebsiteScreenshotWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import type { AIDimensionOutput } from '@/types/aiOutputs';

export default function D5Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D5');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const findings = dimension?.aiFindings as unknown as (AIDimensionOutput & { logoGrade?: string }) | undefined;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D5" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      <LogoAuditWidget logoUrl={cd?.logoUrl} logoAnalysis={findings ? { overallGrade: findings.logoGrade, ...findings } : null} />
      <WebsiteScreenshotWidget screenshotUrl={cd?.screenshotUrl} websiteUrl={audit?.developer?.websiteUrl} />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D5" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

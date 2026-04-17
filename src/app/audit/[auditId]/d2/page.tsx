'use client';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { SEOMetricsWidget } from '@/components/widgets/SEOMetricsWidget';
import { WebsiteScreenshotWidget } from '@/components/widgets/WebsiteScreenshotWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D2Page({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimension = audit?.dimensions?.find(d => d.code === 'D2');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D2" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      <SEOMetricsWidget seoData={cd?.seoKeywords} backlinksData={cd?.backlinks} />
      <WebsiteScreenshotWidget screenshotUrl={cd?.screenshotUrl} websiteUrl={audit?.developer?.websiteUrl} />
      <RawDataPanel data={cd?.technicalSeo} label="Technical SEO Data" />
      <RawDataPanel data={cd?.websiteContent} label="Website Crawl Data" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D2" dimension={dimension} leftContent={leftContent} rightContent={rightContent} />
    </AppShell>
  );
}

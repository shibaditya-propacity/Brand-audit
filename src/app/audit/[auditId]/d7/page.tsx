'use client';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { ReviewsWidget } from '@/components/widgets/ReviewsWidget';
import { SentimentWidget } from '@/components/widgets/SentimentWidget';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function D7Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);

  const dimension = audit?.dimensions?.find(d => d.code === 'D7');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));
  const cd = audit?.collectedData;
  const dev = audit?.developer;

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  async function handleCollectReviews() {
    setCollecting(true);
    setCollectError(null);
    try {
      const res = await fetch('/api/collect/gmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: dev?.gmbPlaceId, auditId: params.auditId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Collection failed');
      await refetch();
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : 'Failed to collect reviews');
    } finally {
      setCollecting(false);
    }
  }

  const reviewSummary = cd?.googleReviews as { fetchedCount?: number; overallRating?: number | null; totalReviews?: number | null } | null | undefined;
  const hasReviews    = reviewSummary != null && (reviewSummary.overallRating != null || (reviewSummary.fetchedCount ?? 0) > 0);

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D7" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      {/* Reviews collection control */}
      <div className="rounded-lg border bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Google Reviews Data</p>
          <p className="text-xs text-muted-foreground">
            {hasReviews
              ? reviewSummary!.fetchedCount
                ? `${reviewSummary!.fetchedCount} review(s) collected · ${reviewSummary!.overallRating ?? '—'}★ overall`
                : `Rating: ${reviewSummary!.overallRating}★ · ${reviewSummary!.totalReviews ?? '—'} total reviews`
              : 'Not collected yet'}
          </p>
          {collectError && <p className="text-xs text-red-500 mt-1">{collectError}</p>}
        </div>
        <button
          onClick={handleCollectReviews}
          disabled={collecting}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {collecting ? 'Collecting…' : hasReviews ? 'Refresh' : 'Collect Now'}
        </button>
      </div>

      <ReviewsWidget gmbData={cd?.gmbData} />
      <SentimentWidget findings={dimension?.aiFindings} />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D7" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

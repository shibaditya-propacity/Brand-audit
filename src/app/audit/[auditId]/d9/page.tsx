'use client';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DimensionPageShell } from '@/components/dimension/DimensionPageShell';
import { AIFindingsPanel } from '@/components/dimension/AIFindingsPanel';
import { ChecklistTable } from '@/components/dimension/ChecklistTable';
import { RawDataPanel } from '@/components/dimension/RawDataPanel';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import type { DiscoveredCompetitor } from '@/types/audit';

export default function D9Page({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Hold results directly from API response so they render without waiting for refetch
  const [liveCompetitors, setLiveCompetitors] = useState<DiscoveredCompetitor[] | null>(null);
  const [liveKeywords, setLiveKeywords] = useState<string[]>([]);

  const dimension = audit?.dimensions?.find(d => d.code === 'D9');
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;

  const statedCompetitors: string[] = audit?.developer?.competitors ?? [];
  // Prefer live results; fall back to persisted data
  const savedData = audit?.collectedData?.competitorData;
  const discoveredCompetitors: DiscoveredCompetitor[] = liveCompetitors ?? savedData?.competitors ?? [];
  const usedKeywords: string[] = liveKeywords.length > 0 ? liveKeywords : (savedData?.keywords ?? []);
  const hasSearched = liveCompetitors !== null || !!savedData;

  async function handleSearchCompetitors() {
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/collect/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: params.auditId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Search failed');
      // Show results immediately from the API response
      setLiveCompetitors(json.competitors ?? []);
      setLiveKeywords(json.keywords ?? []);
      refetch(); // update audit in background
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  const leftContent = (
    <>
      <AIFindingsPanel dimension={dimension} />
      <ChecklistTable dimensionCode="D9" dimension={dimension} />
    </>
  );

  const rightContent = (
    <>
      {/* Stated competitors — manually entered at audit creation */}
      {statedCompetitors.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-sm mb-3">Stated Competitors</h3>
          <ul className="space-y-1">
            {statedCompetitors.map((c) => (
              <li key={c} className="text-sm flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discovered competitors via Serper keyword search */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">Competitors Discovered via Search</h3>
          <button
            onClick={handleSearchCompetitors}
            disabled={searching}
            className="text-xs px-2.5 py-1 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {searching ? 'Searching…' : discoveredCompetitors.length > 0 ? 'Refresh' : 'Search Now'}
          </button>
        </div>

        {usedKeywords.length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            Keywords used: {usedKeywords.join(', ')}
          </p>
        )}

        {searchError && (
          <p className="text-xs text-red-500 mb-2">{searchError}</p>
        )}

        {searching && (
          <p className="text-xs text-muted-foreground animate-pulse mt-2">
            Searching for competitors using brand keywords…
          </p>
        )}

        {!searching && discoveredCompetitors.length > 0 && (
          <ul className="space-y-3 mt-2">
            {discoveredCompetitors.map((c, i) => (
              <li key={`${c.name}-${i}`} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="min-w-0">
                    {c.link ? (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline leading-tight block truncate"
                      >
                        {c.name}
                      </a>
                    ) : (
                      <span className="font-medium leading-tight block">{c.name}</span>
                    )}
                    {c.domain && (
                      <span className="text-xs text-muted-foreground block">{c.domain}</span>
                    )}
                    {c.address && (
                      <span className="text-xs text-muted-foreground block">{c.address}</span>
                    )}
                    {c.rating != null && (
                      <span className="text-xs text-amber-500">★ {c.rating}</span>
                    )}
                    {c.snippet && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.snippet}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!searching && discoveredCompetitors.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {hasSearched
              ? 'No competitors found. Try adding a city or product type to the brand profile.'
              : 'Click "Search Now" to discover competitors using brand keywords and location.'}
          </p>
        )}
      </div>

      <RawDataPanel data={audit?.collectedData?.seoKeywords} label="SERP Data (for competitive ranking)" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D9" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

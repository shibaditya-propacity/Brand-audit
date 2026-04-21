'use client';
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
    </>
  );

  const rightContent = (
    <>
      {dev && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
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
      <RawDataPanel data={audit?.collectedData?.websiteContent} label="Website Promoter Signals" />
    </>
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <DimensionPageShell dimensionCode="D10" dimension={dimension} leftContent={leftContent} rightContent={rightContent} auditId={params.auditId} onRerunComplete={refetch} />
    </AppShell>
  );
}

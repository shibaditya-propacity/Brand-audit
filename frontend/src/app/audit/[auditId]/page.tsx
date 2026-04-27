'use client';
import { AppShell } from '@/components/layout/AppShell';
import { AuditOverview } from '@/components/dashboard/AuditOverview';
import { useAuditData } from '@/hooks/useAuditData';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AuditDashboardPage({ params }: { params: { auditId: string } }) {
  const { audit, loading, refetch } = useAuditData(params.auditId);

  const dimensionScores = Object.fromEntries(
    (audit?.dimensions || []).map(d => [d.code, d.score])
  );
  const dimensionStatuses = Object.fromEntries(
    (audit?.dimensions || []).map(d => [d.code, d.status])
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores} dimensionStatuses={dimensionStatuses}>
      {loading ? (
        <DimensionPageSkeleton />
      ) : !audit ? (
        <div className="p-6"><p className="text-muted-foreground">Audit not found.</p></div>
      ) : (
        <AuditOverview audit={audit} onRefetch={refetch} />
      )}
    </AppShell>
  );
}

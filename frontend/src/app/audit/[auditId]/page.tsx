'use client';
import { AppShell } from '@/components/layout/AppShell';
import { AuditOverview } from '@/components/dashboard/AuditOverview';
import { useAuditData } from '@/hooks/useAuditData';
import { useAuditStore } from '@/store/auditStore';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AuditDashboardPage({ params }: { params: { auditId: string } }) {
  const { audit: localAudit, loading, refetch } = useAuditData(params.auditId);
  // Also subscribe to the store — updates when any dimension page reruns
  const storeAudit = useAuditStore(s => s.currentAudit);

  // Prefer store data when it's the same audit (updated by a dimension rerun)
  const audit = (storeAudit && (storeAudit as { _id?: unknown })._id?.toString() === params.auditId)
    ? storeAudit
    : localAudit;

  const dimensionScores = Object.fromEntries(
    (audit?.dimensions || []).map(d => [d.code, d.score])
  );
  const dimensionStatuses = Object.fromEntries(
    (audit?.dimensions || []).map(d => [d.code, d.status])
  );

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores} dimensionStatuses={dimensionStatuses}>
      {loading && !audit ? (
        <DimensionPageSkeleton />
      ) : !audit ? (
        <div className="p-6"><p className="text-muted-foreground">Audit not found.</p></div>
      ) : (
        <AuditOverview audit={audit} onRefetch={refetch} />
      )}
    </AppShell>
  );
}

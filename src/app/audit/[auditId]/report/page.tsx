'use client';
import { useAuditData } from '@/hooks/useAuditData';
import { AppShell } from '@/components/layout/AppShell';
import { ReportViewer } from '@/components/report/ReportViewer';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import { Printer } from 'lucide-react';

export default function ReportPage({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;
  if (!audit) return <AppShell auditId={params.auditId}><div className="p-6 text-muted-foreground">Audit not found.</div></AppShell>;

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-2 bg-white border-b no-print">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" /> Print Report
        </button>
      </div>
      <ReportViewer audit={audit} />
    </AppShell>
  );
}

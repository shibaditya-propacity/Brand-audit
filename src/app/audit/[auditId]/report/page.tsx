'use client';
import { useAuditData } from '@/hooks/useAuditData';
import { AppShell } from '@/components/layout/AppShell';
import { ReportViewer } from '@/components/report/ReportViewer';
import { DimensionPageSkeleton } from '@/components/shared/LoadingSkeleton';
import { Printer, Download, ExternalLink } from 'lucide-react';

export default function ReportPage({ params }: { params: { auditId: string } }) {
  const { audit, loading } = useAuditData(params.auditId);
  const dimensionScores = Object.fromEntries((audit?.dimensions || []).map(d => [d.code, d.score]));

  if (loading) return <AppShell auditId={params.auditId}><DimensionPageSkeleton /></AppShell>;
  if (!audit) return <AppShell auditId={params.auditId}><div className="p-6 text-muted-foreground">Audit not found.</div></AppShell>;

  const brandName = audit.developer?.brandName ?? 'Brand';
  const printUrl = `/audit/${params.auditId}/report/print`;

  function openPrint() {
    window.open(`${printUrl}?auto=1`, '_blank', 'width=1050,height=800');
  }

  function openPreview() {
    window.open(printUrl, '_blank', 'width=1050,height=800');
  }

  return (
    <AppShell auditId={params.auditId} dimensionScores={dimensionScores}>
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-2.5 bg-white border-b shadow-sm">
        <div className="text-sm font-semibold text-slate-700">
          {brandName} — Brand Audit Report <span className="text-xs font-normal text-slate-400">(preview)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openPreview}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Open Full Report
          </button>
          <button
            onClick={openPrint}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={openPrint}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Preview — inside AppShell's scrollable main, just for browsing */}
      <div className="bg-slate-100 min-h-full py-6 px-4">
        <div className="max-w-5xl mx-auto shadow-xl rounded-lg overflow-hidden border border-slate-200 bg-white">
          <ReportViewer audit={audit} />
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuditData } from '@/hooks/useAuditData';
import { ReportViewer } from '@/components/report/ReportViewer';

function PrintContent({ auditId }: { auditId: string }) {
  const { audit, loading } = useAuditData(auditId);
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('auto') === '1';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && audit) {
      const t = setTimeout(() => {
        setReady(true);
        if (autoPrint) window.print();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [loading, audit, autoPrint]);

  if (loading || !audit) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14 }}>Loading report…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; }

        #print-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        #print-toolbar button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #6366f1;
          color: white;
          transition: background 0.15s;
        }
        #print-toolbar button:hover { background: #4f46e5; }
        #print-toolbar .hint { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        @media print {
          #print-toolbar { display: none !important; }

          /* Running page header */
          .report-page-header {
            display: flex !important;
            position: fixed;
            top: 0; left: 0; right: 0;
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 5px 24px;
            align-items: center;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
            z-index: 9999;
          }
          .report-content { margin-top: 28px; }

          .print-break { page-break-before: always; break-before: page; }
          .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }

          @page { margin: 14mm 12mm 14mm 12mm; size: A4; }
        }
      `}</style>

      {!autoPrint && (
        <div id="print-toolbar">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {audit.developer?.brandName} — Brand Audit Report
            </div>
            <div className="hint">
              {ready
                ? 'Click "Print / Save as PDF" — choose "Save as PDF" in the print dialog to download.'
                : 'Rendering report…'}
            </div>
          </div>
          <button onClick={() => window.print()}>
            🖨&nbsp;&nbsp;Print / Save as PDF
          </button>
        </div>
      )}

      <ReportViewer audit={audit} />
    </>
  );
}

export default function ReportPrintPage({ params }: { params: { auditId: string } }) {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', fontSize: 14, fontFamily: 'sans-serif' }}>
        Loading…
      </div>
    }>
      <PrintContent auditId={params.auditId} />
    </Suspense>
  );
}

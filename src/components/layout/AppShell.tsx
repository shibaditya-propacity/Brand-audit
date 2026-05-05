'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TopBar } from './TopBar';
import { AuditSidebar } from './AuditSidebar';

interface AppShellProps {
  children: React.ReactNode;
  auditId?: string;
  dimensionScores?: Partial<Record<string, number | null>>;
  dimensionStatuses?: Partial<Record<string, string>>;
}

function AppShellInner({ children, auditId, dimensionScores, dimensionStatuses }: AppShellProps) {
  const searchParams = useSearchParams();
  const embedded = searchParams.get('embedded') === '1';

  return (
    <div className={`flex flex-col h-screen ${embedded ? 'bg-[#F4F6FB]' : 'bg-white dark:bg-slate-950'}`}>
      {!embedded && <TopBar />}
      <div className="flex flex-1 overflow-hidden">
        {auditId && (
          <AuditSidebar
            auditId={auditId}
            dimensionScores={dimensionScores}
            dimensionStatuses={dimensionStatuses}
          />
        )}
        <main className={`flex-1 overflow-y-auto ${embedded ? 'bg-[#F4F6FB]' : 'bg-white dark:bg-slate-950'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">{props.children}</main>
        </div>
      </div>
    }>
      <AppShellInner {...props} />
    </Suspense>
  );
}

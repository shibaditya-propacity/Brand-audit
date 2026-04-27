'use client';
import { TopBar } from './TopBar';
import { AuditSidebar } from './AuditSidebar';

interface AppShellProps {
  children: React.ReactNode;
  auditId?: string;
  dimensionScores?: Partial<Record<string, number | null>>;
  dimensionStatuses?: Partial<Record<string, string>>;
}

export function AppShell({ children, auditId, dimensionScores, dimensionStatuses }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {auditId && (
          <AuditSidebar
            auditId={auditId}
            dimensionScores={dimensionScores}
            dimensionStatuses={dimensionStatuses}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}

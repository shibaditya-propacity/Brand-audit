import { TopBar } from '@/components/layout/TopBar';
import { AuditWizard } from '@/components/wizard/AuditWizard';

export default function NewAuditPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      <main className="flex-1">
        <AuditWizard />
      </main>
    </div>
  );
}

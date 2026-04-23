import Link from 'next/link';
import { Plus, Building2, ChevronRight, BarChart3 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { formatDate } from '@/lib/utils';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

async function getAudits() {
  try {
    await connectDB();
    const audits = await Audit.find().sort({ createdAt: -1 }).limit(50).lean();
    const withDevelopers = await Promise.all(
      audits.map(async (audit) => {
        const developer = await Developer.findById(audit.developerId).lean();
        return { ...audit, developer };
      })
    );
    return JSON.parse(JSON.stringify(withDevelopers));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const audits = await getAudits();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-4">
            <Building2 className="h-4 w-4" />
            Propacity Brand Audit Platform
          </div>
          <h1 className="text-3xl font-black mb-3">Audit Real Estate Brands with AI</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">10-dimension brand audit powered by live data from Google, Instagram, DataForSEO, and Claude AI. No mock data — every insight is evidence-based.</p>
          <Link href="/audit/new" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-5 w-5" /> Start New Audit
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Audits', value: audits.length },
            { label: 'Complete', value: audits.filter((a: { status: string }) => a.status === 'COMPLETE').length },
            { label: 'Dimensions', value: '10' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-white p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Audits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Recent Audits</h2>
            <Link href="/audit/new" className="text-sm text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> New Audit
            </Link>
          </div>

          {audits.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">No audits yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first brand audit to get started.</p>
              <Link href="/audit/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Start Audit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit: {
                _id: string;
                developer?: { brandName?: string; city?: string; positioning?: string };
                status: string;
                overallScore?: number;
                createdAt: string;
                auditorName?: string;
              }) => (
                <Link
                  key={audit._id}
                  href={`/audit/${audit._id}`}
                  className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold">{audit.developer?.brandName || 'Unnamed Brand'}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        audit.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                        audit.status === 'COLLECTING' || audit.status === 'ANALYZING' ? 'bg-blue-100 text-blue-700' :
                        audit.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>{audit.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[audit.developer?.city, audit.developer?.positioning, audit.auditorName ? `By ${audit.auditorName}` : null].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(audit.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={audit.overallScore} size="md" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

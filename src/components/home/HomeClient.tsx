'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CountUp from 'react-countup';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Plus, Building2, ChevronRight, BarChart3, Sparkles,
  TrendingUp, Shield, Activity, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { ProtectedLink } from '@/components/shared/ProtectedLink';
import { AuthModal } from '@/components/auth/AuthModal';
import { formatDate } from '@/lib/utils';

interface AuditSummary {
  _id: string;
  developer?: { brandName?: string; city?: string; positioning?: string };
  status: string;
  overallScore?: number;
  createdAt: string;
  auditorName?: string;
}

interface HomeClientProps {
  audits: AuditSummary[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETE:   { label: 'Complete',   color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30', icon: CheckCircle2 },
  COLLECTING: { label: 'Collecting', color: 'bg-blue-500/15   text-blue-600   dark:text-blue-400   ring-1 ring-blue-500/30',    icon: Activity },
  ANALYZING:  { label: 'Analyzing',  color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30', icon: Activity },
  FAILED:     { label: 'Failed',     color: 'bg-red-500/15    text-red-600    dark:text-red-400    ring-1 ring-red-500/30',     icon: AlertCircle },
  DRAFT:      { label: 'Draft',      color: 'bg-slate-500/15  text-slate-600  dark:text-slate-400  ring-1 ring-slate-500/30',  icon: Clock },
};

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const row      = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function StatCard({ value, label, icon: Icon, color }: { value: number | string; label: string; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="glass-card rounded-2xl p-5 flex items-center gap-4 shadow-sm"
    >
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
          {typeof value === 'number' ? <CountUp end={value} duration={1.8} enableScrollSpy /> : value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export function HomeClient({ audits }: HomeClientProps) {
  const totalComplete  = audits.filter(a => a.status === 'COMPLETE').length;
  const inProgress     = audits.filter(a => a.status === 'COLLECTING' || a.status === 'ANALYZING').length;
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>();

  // Middleware redirects here with ?authRequired=1&redirect=/audit/...
  // Only open if not already authenticated
  useEffect(() => {
    if (loading) return;
    if (searchParams.get('authRequired') === '1') {
      if (user) {
        // Already logged in — go straight to the intended destination
        const dest = searchParams.get('redirect') ?? '/';
        router.replace(dest);
      } else {
        setRedirectTo(searchParams.get('redirect') ?? undefined);
        setAuthOpen(true);
      }
    }
  }, [searchParams, user, loading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" style={{ animationDelay: '0s' }} />
          <div className="animate-float absolute top-10 right-0 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl" style={{ animationDelay: '1.2s' }} />
          <div className="animate-float absolute bottom-0 left-1/2 w-64 h-64 rounded-full bg-cyan-400/8 blur-3xl" style={{ animationDelay: '2.1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 px-4 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Claude AI · 10 Brand Dimensions
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-black leading-tight mb-4"
          >
            Audit Real Estate{' '}
            <span className="gradient-text">Brands</span>
            <br />with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base mb-8 leading-relaxed"
          >
            Evidence-based brand intelligence powered by live data from Google, Instagram,
            DataForSEO &amp; Claude AI. No mock data — every insight is real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <ProtectedLink
              href="/audit/new"
              className="animate-pulse-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              Start New Audit
            </ProtectedLink>
            {audits.length > 0 && (
              <a
                href="#audits"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                View Audits
                <ChevronRight className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto w-full px-4 -mt-6 mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value={audits.length} label="Total Audits" icon={BarChart3} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
          <StatCard value={totalComplete} label="Complete" icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
          <StatCard value={inProgress} label="In Progress" icon={Activity} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
          <StatCard value="10" label="Dimensions" icon={TrendingUp} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
        </div>
      </section>

      {/* ── Audit List ── */}
      <main id="audits" className="flex-1 max-w-5xl mx-auto px-4 pb-16 w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Audits</h2>
          <ProtectedLink
            href="/audit/new"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Audit
          </ProtectedLink>
        </div>

        {audits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center"
          >
            <div className="animate-float inline-flex">
              <BarChart3 className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">No audits yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Create your first brand audit to get started.
            </p>
            <ProtectedLink
              href="/audit/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
            >
              <Plus className="h-4 w-4" /> Start Audit
            </ProtectedLink>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {audits.map((audit) => {
                const cfg  = statusConfig[audit.status] || statusConfig.DRAFT;
                const Icon = cfg.icon;
                const isLive = audit.status === 'COLLECTING' || audit.status === 'ANALYZING';

                return (
                  <motion.div key={audit._id} variants={row} layout>
                    <ProtectedLink
                      href={`/audit/${audit._id}`}
                      className="group flex items-center gap-4 rounded-2xl glass-card p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-700"
                    >
                      {/* Brand icon */}
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {audit.developer?.brandName || 'Unnamed Brand'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color} flex-shrink-0`}>
                            <Icon className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[
                            audit.developer?.city,
                            audit.developer?.positioning,
                            audit.auditorName ? `By ${audit.auditorName}` : null,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(audit.createdAt)}</p>
                      </div>

                      {/* Score + arrow */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBadge score={audit.overallScore} size="md" />
                        <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </ProtectedLink>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Footer hint */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-600">
          <Shield className="h-3 w-3" />
          Propacity Brand Audit Platform · Evidence-based AI analysis
        </div>
      </div>

      {/* Auth modal triggered by middleware redirect */}
      <AuthModal
        open={authOpen}
        defaultTab="signin"
        redirectTo={redirectTo}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}

'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Badge } from '@tremor/react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip,
} from 'recharts';
import CountUp from 'react-countup';
import {
  AlertTriangle, CheckCircle2, ChevronDown, BarChart3,
  CheckCircle, Clock, TrendingUp, Zap,
} from 'lucide-react';
import { DIMENSIONS } from '@/config/dimensions';
import { getScoreLabel } from '@/config/scoring';
import { AuditProgress } from './AuditProgress';
import { DimensionGrid } from './DimensionGrid';
import type { AuditWithRelations } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';
import { CollateralAnalysisPanel } from '@/components/shared/CollateralAnalysisPanel';

interface AuditOverviewProps {
  audit: AuditWithRelations;
  onRefetch: () => void;
}

function getScoreGradient(score: number): string {
  if (score <= 40) return 'from-rose-500 to-red-600';
  if (score <= 60) return 'from-orange-400 to-orange-600';
  if (score <= 75) return 'from-yellow-400 to-amber-500';
  if (score <= 90) return 'from-green-400 to-emerald-500';
  return 'from-emerald-400 to-teal-500';
}

function getScoreColor(score: number): string {
  if (score <= 40) return '#ef4444';
  if (score <= 60) return '#f97316';
  if (score <= 75) return '#eab308';
  if (score <= 90) return '#22c55e';
  return '#10b981';
}

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = {
  hidden:   { opacity: 0, y: 12 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ── Score Ring ── */
function ScoreRing({
  score,
  label,
  subtitle,
  size = 'lg',
}: {
  score: number;
  label: string;
  subtitle?: string;
  size?: 'sm' | 'lg';
}) {
  const dim   = size === 'lg' ? 160 : 120;
  const color = getScoreColor(score);
  const data  = [{ name: 'score', value: score, fill: color }];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        {/* glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20 pointer-events-none"
          style={{ background: color }}
        />
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="68%" outerRadius="90%"
            data={data}
            startAngle={90} endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${size === 'lg' ? 'text-3xl' : 'text-2xl'} font-black text-slate-900 dark:text-slate-100`}>
            <CountUp end={score} duration={2} enableScrollSpy />
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
        {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({
  label, value, icon: Icon, gradient, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  sub?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -1 }}
      className="glass-card rounded-2xl p-4 flex items-start gap-3 shadow-sm"
    >
      <div className={`rounded-xl p-2.5 bg-gradient-to-br ${gradient} shadow-md`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 dark:text-slate-100">
          {typeof value === 'number' ? <CountUp end={value} duration={1.5} enableScrollSpy /> : value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Strengths tab ── */
function StrengthsTab({ dimensions }: { dimensions: AuditWithRelations['dimensions'] }) {
  const items = dimensions.flatMap(d => {
    const findings = d.aiFindings as unknown as AIDimensionOutput | null;
    const dimMeta  = DIMENSIONS.find(m => m.code === d.code);
    return (findings?.strengths || []).map((s, i) => ({
      key: `${d.code}-${i}`, text: s,
      code: d.code, label: dimMeta?.shortName || d.code,
    }));
  });

  if (!items.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No strengths data yet.</p>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
      {items.map(item => (
        <motion.div key={item.key} variants={itemVariants}
          className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/8 border border-emerald-500/15"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-snug">{item.text}</p>
          <Badge color="emerald" size="xs">{item.label}</Badge>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Issues tab ── */
function IssuesTab({ dimensions }: { dimensions: AuditWithRelations['dimensions'] }) {
  const allFlags = dimensions.flatMap(d => {
    const dimMeta = DIMENSIONS.find(m => m.code === d.code);
    return (d.aiFlags || []).map(flag => ({
      flag, code: d.code, label: dimMeta?.shortName || d.code,
    }));
  });

  if (!allFlags.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No critical issues found.</p>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
      {allFlags.map((item, idx) => <FlagCard key={idx} item={item} />)}
    </motion.div>
  );
}

function FlagCard({ item }: { item: { flag: string; code: string; label: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={itemVariants}>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div className="rounded-xl border border-rose-200/60 dark:border-rose-800/40 overflow-hidden">
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-snug">{item.flag}</p>
              <Badge color="rose" size="xs">{item.label}</Badge>
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </motion.span>
            </button>
          </Collapsible.Trigger>
          <AnimatePresence initial={false}>
            {open && (
              <Collapsible.Content forceMount asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-3 pb-3 pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-rose-100 dark:border-rose-900/30">
                    Navigate to the <strong>{item.label}</strong> dimension page for detailed recommendations.
                  </p>
                </motion.div>
              </Collapsible.Content>
            )}
          </AnimatePresence>
        </div>
      </Collapsible.Root>
    </motion.div>
  );
}

/* ── Main component ── */
export function AuditOverview({ audit, onRefetch }: AuditOverviewProps) {
  const [activeTab, setActiveTab] = useState<string>('issues');
  const dims = audit.dimensions || [];

  const completedDims  = dims.filter(d => d.status === 'complete' && d.score !== null);
  const allComplete    = completedDims.length === 10;
  const overallScore   = audit.overallScore ?? 0;

  const allFlags   = dims.flatMap(d => d.aiFlags || []);
  const passItems  = dims.flatMap(d => d.items || []).filter(i => i.status === 'PASS').length;
  const failItems  = dims.flatMap(d => d.items || []).filter(i => i.status === 'FAIL').length;
  const isRunning  = ['COLLECTING', 'ANALYZING'].includes(audit.status);
  const hasAnyData = completedDims.length > 0;
  const gradient   = getScoreGradient(overallScore);

  const radarData = DIMENSIONS.map(d => ({
    subject: d.shortName,
    score: dims.find(a => a.code === d.code)?.score ?? 0,
    fullMark: 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6"
    >
      {/* ── HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-sm"
      >
        {/* Gradient accent strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 truncate">
              {audit.developer?.brandName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {[
                audit.developer?.city,
                audit.developer?.positioning,
                `Audit by ${audit.auditorName || 'Propacity'}`,
              ].filter(Boolean).join(' · ')}
            </p>
            {hasAnyData && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-gradient-to-r ${gradient} text-white shadow-sm`}>
                  <Zap className="h-3.5 w-3.5" />
                  {getScoreLabel(overallScore)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {completedDims.length}/10 dimensions analyzed
                </span>
              </div>
            )}
          </div>

          {/* Score ring */}
          {hasAnyData && (
            <div className="flex items-center gap-6">
              <ScoreRing
                score={Math.round(overallScore)}
                label={allComplete ? 'Final Score' : 'Overall Score'}
                subtitle={allComplete ? undefined : 'all 10 dims'}
                size="lg"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── METRIC CARDS ── */}
      {hasAnyData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <StatCard
            label="Overall Score"
            value={`${Math.round(overallScore)}/100`}
            icon={BarChart3}
            gradient="from-primary to-violet-600"
          />
          <StatCard
            label="Pass / Fail Items"
            value={`${passItems}/${failItems}`}
            icon={CheckCircle}
            gradient="from-emerald-400 to-green-600"
            sub={`${passItems + failItems} total`}
          />
          <StatCard
            label="Critical Flags"
            value={allFlags.length}
            icon={AlertTriangle}
            gradient="from-rose-400 to-red-600"
            sub={allFlags.length === 0 ? 'None found' : 'Need attention'}
          />
          <StatCard
            label="Dims Complete"
            value={`${completedDims.length}/10`}
            icon={TrendingUp}
            gradient="from-blue-400 to-primary"
            sub={allComplete ? 'All done' : `${10 - completedDims.length} pending`}
          />
        </motion.div>
      )}

      {/* ── RUNNING / RADAR + TABS ── */}
      {isRunning ? (
        <AuditProgress auditId={audit._id as string} onComplete={onRefetch} />
      ) : hasAnyData ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Score Radar
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsRadar data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.3)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#94a3b8">
                      {payload.value}
                    </text>
                  )}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickCount={5} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.85)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(v: number) => [`${v}`, 'Score']}
                />
              </RechartsRadar>
            </ResponsiveContainer>
          </motion.div>

          {/* Issues / Strengths Tabs */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-card rounded-2xl p-5 shadow-sm"
          >
            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
              <TabsPrimitive.List className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
                {['issues', 'strengths'].map(tab => (
                  <TabsPrimitive.Trigger
                    key={tab}
                    value={tab}
                    className="relative flex-1 px-3 py-2 text-xs font-semibold capitalize rounded-lg text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 transition-colors"
                  >
                    {activeTab === tab && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      {tab === 'issues'
                        ? <AlertTriangle className="h-3 w-3 text-rose-500" />
                        : <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                      {tab}
                      {tab === 'issues' && allFlags.length > 0 && (
                        <span className="ml-0.5 rounded-full bg-rose-500 text-white px-1.5 text-[9px] font-bold">{allFlags.length}</span>
                      )}
                    </span>
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>

              <div className="max-h-64 overflow-y-auto pr-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TabsPrimitive.Content value="issues" forceMount hidden={activeTab !== 'issues'}>
                      <IssuesTab dimensions={dims} />
                    </TabsPrimitive.Content>
                    <TabsPrimitive.Content value="strengths" forceMount hidden={activeTab !== 'strengths'}>
                      <StrengthsTab dimensions={dims} />
                    </TabsPrimitive.Content>
                  </motion.div>
                </AnimatePresence>
              </div>
            </TabsPrimitive.Root>
          </motion.div>
        </div>
      ) : null}

      {/* ── No data state ── */}
      {!isRunning && !hasAnyData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center"
        >
          <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-1">No analysis yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Run the audit to generate dimension scores and insights.
          </p>
        </motion.div>
      )}

      {/* ── Collateral Analysis ── */}
      <div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary rounded-full" />
          Collateral Analysis
        </h2>
        <CollateralAnalysisPanel
          analysis={audit.collectedData?.collateralAnalysis}
          hasDocs={!!(audit.developer as { collateralDocs?: unknown[] })?.collateralDocs?.length}
        />
      </div>

      {/* ── Dimension Grid ── */}
      <div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary rounded-full" />
          All Dimensions
        </h2>
        <DimensionGrid auditId={audit._id as string} dimensions={dims} />
      </div>
    </motion.div>
  );
}

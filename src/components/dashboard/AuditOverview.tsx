'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Card, BadgeDelta, Badge, Metric, Text } from '@tremor/react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import CountUp from 'react-countup';
import { AlertTriangle, CheckCircle2, ChevronDown, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { DIMENSIONS } from '@/config/dimensions';
import { getScoreLabel } from '@/config/scoring';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AuditProgress } from './AuditProgress';
import { DimensionGrid } from './DimensionGrid';
import type { AuditWithRelations } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';

interface AuditOverviewProps {
  audit: AuditWithRelations;
  onRefetch: () => void;
}

function getTremorColor(score: number): 'red' | 'orange' | 'yellow' | 'green' | 'emerald' {
  if (score <= 40) return 'red';
  if (score <= 60) return 'orange';
  if (score <= 75) return 'yellow';
  if (score <= 90) return 'green';
  return 'emerald';
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function ScoreRing({ score }: { score: number }) {
  const data = [{ name: 'Score', value: score, fill: '#6366f1' }];
  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="68%" outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          <CountUp end={score} duration={2} enableScrollSpy />
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function StrengthsTab({ dimensions }: { dimensions: AuditWithRelations['dimensions'] }) {
  const passItems = dimensions.flatMap(d => {
    const findings = d.aiFindings as unknown as AIDimensionOutput | null;
    const dimMeta = DIMENSIONS.find(m => m.code === d.code);
    return (findings?.strengths || []).map((s, i) => ({
      key: `${d.code}-${i}`,
      text: s,
      code: d.code,
      label: dimMeta?.shortName || d.code,
    }));
  });

  if (passItems.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No strengths data available yet.</p>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
      {passItems.map(item => (
        <motion.div key={item.key} variants={itemVariants}>
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
              </div>
              <Badge color="emerald" size="xs">{item.label}</Badge>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function IssuesTab({ dimensions }: { dimensions: AuditWithRelations['dimensions'] }) {
  const allFlags: Array<{ flag: string; code: string; label: string }> = [];
  for (const d of dimensions) {
    const dimMeta = DIMENSIONS.find(m => m.code === d.code);
    (d.aiFlags || []).forEach(flag => allFlags.push({
      flag,
      code: d.code,
      label: dimMeta?.shortName || d.code,
    }));
  }

  if (allFlags.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No critical issues found.</p>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
      {allFlags.map((item, idx) => (
        <FlagCard key={idx} item={item} />
      ))}
    </motion.div>
  );
}

function FlagCard({ item }: { item: { flag: string; code: string; label: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-400 p-0 overflow-hidden">
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.flag}</p>
              <Badge color="rose" size="xs">{item.label}</Badge>
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-slate-400" />
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
                  <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Navigate to the {item.label} dimension page for detailed recommendations.</p>
                  </div>
                </motion.div>
              </Collapsible.Content>
            )}
          </AnimatePresence>
        </Collapsible.Root>
      </Card>
    </motion.div>
  );
}

export function AuditOverview({ audit, onRefetch }: AuditOverviewProps) {
  const [activeTab, setActiveTab] = useState<string>('issues');
  const dims = audit.dimensions || [];
  const dimensionScores = Object.fromEntries(dims.map(d => [d.code, d.score]));
  const completedDims = dims.filter(d => d.status === 'complete').length;
  const allFlags = dims.flatMap(d => d.aiFlags || []);
  const passItems = dims.flatMap(d => d.items || []).filter(i => i.status === 'PASS').length;
  const failItems = dims.flatMap(d => d.items || []).filter(i => i.status === 'FAIL').length;
  const overallScore = audit.overallScore ?? 0;
  const tier = getTremorColor(overallScore);
  const isRunning = ['COLLECTING', 'ANALYZING'].includes(audit.status);

  const radarData = DIMENSIONS.map(d => ({
    subject: d.shortName,
    score: dimensionScores[d.code] ?? 0,
    fullMark: 100,
  }));

  const metricCards = [
    {
      label: 'Overall Score',
      value: overallScore,
      displayValue: `${Math.round(overallScore)}/100`,
      icon: BarChart3,
      deltaType: 'unchanged' as const,
      color: tier,
    },
    {
      label: 'Pass / Fail Items',
      value: passItems,
      displayValue: `${passItems} / ${failItems}`,
      icon: CheckCircle,
      deltaType: 'increase' as const,
      color: 'green' as const,
    },
    {
      label: 'Critical Flags',
      value: allFlags.length,
      displayValue: allFlags.length,
      icon: AlertTriangle,
      deltaType: 'decrease' as const,
      color: 'rose' as const,
    },
    {
      label: 'Dims Complete',
      value: completedDims,
      displayValue: `${completedDims}/10`,
      icon: Clock,
      deltaType: 'increase' as const,
      color: 'indigo' as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6"
    >
      {/* HERO */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {audit.developer?.brandName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {[audit.developer?.city, audit.developer?.positioning, `Audit by ${audit.auditorName || 'Propacity'}`].filter(Boolean).join(' · ')}
            </p>
            {overallScore > 0 && (
              <div className="mt-3">
                <Badge color={tier} size="lg">
                  {getScoreLabel(overallScore)}
                </Badge>
              </div>
            )}
          </div>
          {overallScore > 0 && <ScoreRing score={Math.round(overallScore)} />}
        </div>
      </Card>

      {/* METRIC ROW */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metricCards.map(card => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Text className="text-slate-500 dark:text-slate-400 text-xs">{card.label}</Text>
                <BadgeDelta deltaType={card.deltaType} size="xs" />
              </div>
              <Metric className="text-slate-900 dark:text-slate-100 text-2xl">
                {typeof card.value === 'number' && typeof card.displayValue === 'number' ? (
                  <CountUp end={card.value} duration={2} enableScrollSpy />
                ) : (
                  <span>{card.displayValue}</span>
                )}
              </Metric>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* RADAR + TABS */}
      {isRunning ? (
        <AuditProgress auditId={audit._id as string} onComplete={onRefetch} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Score Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsRadar data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#6b7280">
                      {payload.value}
                    </text>
                  )}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickCount={5} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
              </RechartsRadar>
            </ResponsiveContainer>
          </Card>

          {/* Issues / Strengths Tabs */}
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
              <TabsPrimitive.List className="flex border-b border-slate-200 dark:border-slate-700 mb-4 relative">
                {['issues', 'strengths'].map(tab => (
                  <TabsPrimitive.Trigger
                    key={tab}
                    value={tab}
                    className="relative px-4 py-2 text-sm font-medium capitalize text-slate-500 dark:text-slate-400 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-colors"
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>

              <div className="max-h-72 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
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
          </Card>
        </div>
      )}

      {/* Dimension Grid */}
      <div>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">All Dimensions</h2>
        <DimensionGrid auditId={audit._id as string} dimensions={dims} />
      </div>
    </motion.div>
  );
}

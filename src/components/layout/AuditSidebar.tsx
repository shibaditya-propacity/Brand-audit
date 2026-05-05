'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DIMENSIONS } from '@/config/dimensions';
import { LayoutDashboard } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface AuditSidebarProps {
  auditId: string;
  dimensionScores?: Partial<Record<string, number | null>>;
  dimensionStatuses?: Partial<Record<string, string>>;
}

function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 60) return '#f97316';
  if (score < 75) return '#eab308';
  if (score < 90) return '#22c55e';
  return '#10b981';
}

function getScorePill(score: number): string {
  if (score < 40) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  if (score < 60) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  if (score < 75) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
  if (score < 90) return 'bg-green-500/10 text-green-600 dark:text-green-400';
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
}

export function AuditSidebar({ auditId, dimensionScores = {}, dimensionStatuses = {} }: AuditSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: `/audit/${auditId}`,         label: 'Overview', icon: 'LayoutDashboard', code: 'overview' },
    ...DIMENSIONS.map(d => ({
      href:  `/audit/${auditId}/${d.code.toLowerCase()}`,
      label: d.shortName,
      icon:  d.icon,
      code:  d.code,
      color: d.color,
    })),
    { href: `/audit/${auditId}/report`, label: 'Report', icon: 'FileText', code: 'report' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map((item, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComp = (Icons as any)[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;
          const isSpecial = item.code === 'overview' || item.code === 'report';
          const score  = !isSpecial ? dimensionScores[item.code]   : undefined;
          const status = !isSpecial ? dimensionStatuses[item.code] : undefined;
          const hasScore = score !== undefined && score !== null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dimColor = (item as any).color as string | undefined;

          return (
            <motion.div
              key={item.code}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.018 }}
              whileHover={{ x: 2 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group flex flex-col gap-1 px-2.5 py-2 rounded-xl text-sm transition-all relative',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="flex items-center gap-2 pl-1">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 rounded-lg p-1 transition-colors"
                    style={isActive && dimColor ? { backgroundColor: `${dimColor}18` } : {}}
                  >
                    <IconComp
                      className="h-3.5 w-3.5"
                      style={isActive && dimColor ? { color: dimColor } : {}}
                    />
                  </div>

                  {/* Label */}
                  <span className="flex-1 truncate text-[11px] font-semibold">
                    {isSpecial ? item.label : `${item.code}: ${item.label}`}
                  </span>

                  {/* Score pill */}
                  {hasScore && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${getScorePill(score as number)}`}>
                      {Math.round(score as number)}
                    </span>
                  )}
                  {!hasScore && status === 'pending' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                  )}
                </div>

                {/* Mini progress bar */}
                {hasScore && (
                  <div className="h-0.5 mx-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getScoreColor(score as number) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.02 }}
                    />
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

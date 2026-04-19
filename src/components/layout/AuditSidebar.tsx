'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DIMENSIONS } from '@/config/dimensions';
import { LayoutDashboard } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { ProgressBar, Badge } from '@tremor/react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface AuditSidebarProps {
  auditId: string;
  dimensionScores?: Partial<Record<string, number | null>>;
  dimensionStatuses?: Partial<Record<string, string>>;
}

function getScoreTier(score: number): 'red' | 'orange' | 'yellow' | 'green' {
  if (score < 40) return 'red';
  if (score < 60) return 'orange';
  if (score < 75) return 'yellow';
  return 'green';
}

export function AuditSidebar({ auditId, dimensionScores = {}, dimensionStatuses = {} }: AuditSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: `/audit/${auditId}`, label: 'Overview', icon: 'LayoutDashboard', code: 'overview' },
    ...DIMENSIONS.map(d => ({
      href: `/audit/${auditId}/${d.code.toLowerCase()}`,
      label: d.shortName,
      fullLabel: d.name,
      icon: d.icon,
      code: d.code,
    })),
    { href: `/audit/${auditId}/report`, label: 'Report', icon: 'FileText', code: 'report' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComp = (Icons as any)[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;
          const score = item.code !== 'overview' && item.code !== 'report'
            ? dimensionScores[item.code]
            : undefined;
          const status = item.code !== 'overview' && item.code !== 'report'
            ? dimensionStatuses[item.code]
            : undefined;
          const hasScore = score !== undefined && score !== null;
          const tier = hasScore ? getScoreTier(score as number) : undefined;

          return (
            <motion.div
              key={item.code}
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col gap-1 px-3 py-2 rounded-md text-sm transition-colors relative',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium border-l-4 border-indigo-500 pl-2'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent pl-2'
                )}
              >
                <div className="flex items-center gap-2">
                  <IconComp className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-xs font-medium">
                    {item.code === 'overview' || item.code === 'report'
                      ? item.label
                      : `${item.code}: ${item.label}`}
                  </span>
                  {hasScore && tier && (
                    <Badge color={tier} size="xs">
                      {Math.round(score as number)}
                    </Badge>
                  )}
                  {!hasScore && status === 'pending' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
                {hasScore && (
                  <ProgressBar
                    value={score as number}
                    color={tier}
                    className="h-1"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

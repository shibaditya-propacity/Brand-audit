'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DIMENSIONS } from '@/config/dimensions';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { LayoutDashboard } from 'lucide-react';
import * as Icons from 'lucide-react';

interface AuditSidebarProps {
  auditId: string;
  dimensionScores?: Partial<Record<string, number | null>>;
  dimensionStatuses?: Partial<Record<string, string>>;
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
    <aside className="w-56 flex-shrink-0 border-r bg-gray-50 flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComp = (Icons as any)[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;
          const score = item.code !== 'overview' && item.code !== 'report' ? dimensionScores[item.code] : undefined;
          const status = item.code !== 'overview' && item.code !== 'report' ? dimensionStatuses[item.code] : undefined;

          return (
            <Link
              key={item.code}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 mx-2 rounded-md text-sm transition-colors',
                isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <IconComp className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.code === 'overview' || item.code === 'report' ? item.label : `${item.code}: ${item.label}`}</span>
              {score !== undefined && score !== null ? (
                <ScoreBadge score={score} size="sm" />
              ) : status === 'pending' ? (
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

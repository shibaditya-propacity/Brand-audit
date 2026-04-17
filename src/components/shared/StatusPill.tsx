import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, MinusCircle, Circle } from 'lucide-react';

type Status = 'PASS' | 'FAIL' | 'PARTIAL' | 'NA' | 'pass' | 'fail' | 'partial' | 'na' | null | undefined;

interface StatusPillProps {
  status: Status;
  className?: string;
}

const CONFIG = {
  PASS: { label: 'Pass', icon: CheckCircle, classes: 'bg-green-100 text-green-700' },
  FAIL: { label: 'Fail', icon: XCircle, classes: 'bg-red-100 text-red-700' },
  PARTIAL: { label: 'Partial', icon: MinusCircle, classes: 'bg-amber-100 text-amber-700' },
  NA: { label: 'N/A', icon: Circle, classes: 'bg-gray-100 text-gray-500' },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const key = status?.toUpperCase() as keyof typeof CONFIG;
  const config = CONFIG[key] || { label: 'Pending', icon: Circle, classes: 'bg-gray-100 text-gray-400' };
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', config.classes, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  colorByScore?: boolean;
  height?: string;
}

export function ProgressBar({ value, max = 100, className, colorByScore = true, height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  let barColor = 'bg-blue-500';
  if (colorByScore) {
    if (value <= 40) barColor = 'bg-red-500';
    else if (value <= 60) barColor = 'bg-amber-500';
    else if (value <= 75) barColor = 'bg-yellow-500';
    else if (value <= 90) barColor = 'bg-green-500';
    else barColor = 'bg-emerald-600';
  }
  return (
    <div className={cn('w-full rounded-full bg-gray-100 overflow-hidden', height, className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
    </div>
  );
}

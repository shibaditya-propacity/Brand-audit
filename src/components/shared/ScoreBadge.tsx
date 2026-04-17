import { cn } from '@/lib/utils';
import { getScoreColor, getScoreLabel, getScoreBgColor } from '@/config/scoring';

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = 'md', showLabel = false, className }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={cn('inline-flex items-center rounded-full bg-gray-100 text-gray-500 font-semibold',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base',
        size === 'xl' && 'px-5 py-2 text-xl',
        className
      )}>--</span>
    );
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-bold',
      getScoreBgColor(score), getScoreColor(score),
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-3 py-1 text-sm',
      size === 'lg' && 'px-4 py-1.5 text-base',
      size === 'xl' && 'px-5 py-2 text-2xl',
      className
    )}>
      {Math.round(score)}
      {showLabel && <span className="ml-1 text-xs font-normal opacity-75">{getScoreLabel(score)}</span>}
    </span>
  );
}

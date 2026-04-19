import { Users, TrendingUp, Calendar, Activity } from 'lucide-react';
import { Card } from '@tremor/react';

interface SocialStatsWidgetProps {
  instagramData: unknown;
}

export function SocialStatsWidget({ instagramData }: SocialStatsWidgetProps) {
  const data = instagramData as {
    metrics?: {
      followers?: number;
      engagementRate?: number;
      postsPerWeek?: number;
      lastPostDate?: string;
      contentMix?: { photos: number; videos: number; carousels: number };
    };
  } | null;

  const m = data?.metrics;

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Instagram Performance</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Followers', value: m?.followers ? m.followers.toLocaleString() : '--' },
          { icon: TrendingUp, label: 'Engagement Rate', value: m?.engagementRate ? `${m.engagementRate}%` : '--' },
          { icon: Activity, label: 'Posts / Week', value: m?.postsPerWeek ?? '--' },
          { icon: Calendar, label: 'Last Post', value: m?.lastPostDate ? new Date(m.lastPostDate).toLocaleDateString('en-IN') : '--' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{String(stat.value)}</p>
          </div>
        ))}
      </div>
      {m?.contentMix && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Content Mix</p>
          <div className="flex gap-2 text-xs flex-wrap">
            {[
              { label: 'Photos', val: m.contentMix.photos, color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
              { label: 'Videos', val: m.contentMix.videos, color: 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' },
              { label: 'Carousels', val: m.contentMix.carousels, color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' },
            ].map(c => (
              <span key={c.label} className={`rounded-full px-2 py-0.5 font-medium ${c.color}`}>{c.val} {c.label}</span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

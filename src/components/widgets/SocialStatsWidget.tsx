import { Users, TrendingUp, Calendar, Activity } from 'lucide-react';

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
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold text-sm">Instagram Performance</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Followers', value: m?.followers ? m.followers.toLocaleString() : '--' },
          { icon: TrendingUp, label: 'Engagement Rate', value: m?.engagementRate ? `${m.engagementRate}%` : '--' },
          { icon: Activity, label: 'Posts / Week', value: m?.postsPerWeek ?? '--' },
          { icon: Calendar, label: 'Last Post', value: m?.lastPostDate ? new Date(m.lastPostDate).toLocaleDateString('en-IN') : '--' },
        ].map(stat => (
          <div key={stat.label} className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-semibold text-sm">{stat.value}</p>
          </div>
        ))}
      </div>
      {m?.contentMix && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Content Mix</p>
          <div className="flex gap-2 text-xs">
            {[
              { label: 'Photos', val: m.contentMix.photos, color: 'bg-blue-100 text-blue-700' },
              { label: 'Videos', val: m.contentMix.videos, color: 'bg-pink-100 text-pink-700' },
              { label: 'Carousels', val: m.contentMix.carousels, color: 'bg-purple-100 text-purple-700' },
            ].map(c => (
              <span key={c.label} className={`rounded-full px-2 py-0.5 font-medium ${c.color}`}>{c.val} {c.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

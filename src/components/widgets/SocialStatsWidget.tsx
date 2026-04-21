'use client';
import { Instagram, Facebook, Linkedin, Users, FileText, UserCheck, Briefcase, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstagramData {
  handle?: string;
  profileUrl?: string | null;
  followers?: number | null;
  following?: number | null;
  totalPosts?: number | null;
  bio?: string | null;
  recentPostSummaries?: string[];
}

interface FacebookData {
  pageUrl?: string | null;
  pageName?: string | null;
  likes?: number | null;
  followers?: number | null;
  talkingAbout?: number | null;
  description?: string | null;
}

interface LinkedInData {
  pageUrl?: string | null;
  companyName?: string | null;
  followers?: number | null;
  employees?: number | null;
  industry?: string | null;
  description?: string | null;
}

interface SocialStatsWidgetProps {
  instagramData: unknown;
  facebookData?: unknown;
  linkedinData?: unknown;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={cn('text-sm font-semibold', highlight ? 'text-slate-900' : 'text-slate-700')}>
        {value}
      </span>
    </div>
  );
}

function PlatformCard({
  icon,
  name,
  color,
  profileUrl,
  available,
  stats,
  description,
  extras,
}: {
  icon: React.ReactNode;
  name: string;
  color: string;
  profileUrl?: string | null;
  available: boolean;
  stats: Array<{ label: string; value: string }>;
  description?: string | null;
  extras?: React.ReactNode;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-white p-4 space-y-3',
      !available && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-lg p-1.5', color)}>{icon}</div>
          <span className="font-semibold text-sm text-slate-800">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {available ? (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">Active</span>
          ) : (
            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 font-medium">No data</span>
          )}
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {available && (
        <div className="grid grid-cols-3 gap-3 py-2 border-t border-b border-slate-100">
          {stats.map(s => <StatCell key={s.label} label={s.label} value={s.value} />)}
        </div>
      )}

      {/* Description / bio */}
      {available && description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{description}</p>
      )}

      {extras}
    </div>
  );
}

export function SocialStatsWidget({ instagramData, facebookData, linkedinData }: SocialStatsWidgetProps) {
  const ig = instagramData as InstagramData | null;
  const fb = facebookData as FacebookData | null;
  const li = linkedinData as LinkedInData | null;

  const igAvailable = !!(ig && (ig.followers != null || ig.totalPosts != null || ig.following != null));
  const fbAvailable = !!(fb && (fb.likes != null || fb.followers != null));
  const liAvailable = !!(li && (li.followers != null || li.employees != null));

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-slate-800 px-0.5">Social Media Presence</h3>

      {/* Instagram */}
      <PlatformCard
        icon={<Instagram className="h-4 w-4 text-pink-600" />}
        name="Instagram"
        color="bg-pink-50"
        profileUrl={ig?.profileUrl}
        available={igAvailable}
        stats={[
          { label: 'Followers', value: fmt(ig?.followers) },
          { label: 'Posts', value: fmt(ig?.totalPosts) },
          { label: 'Following', value: fmt(ig?.following) },
        ]}
        description={ig?.bio}
        extras={
          ig?.recentPostSummaries && ig.recentPostSummaries.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Recent Posts</p>
              {ig.recentPostSummaries.slice(0, 2).map((s, i) => (
                <p key={i} className="text-xs text-slate-500 line-clamp-1 pl-2 border-l-2 border-pink-200">{s}</p>
              ))}
            </div>
          ) : null
        }
      />

      {/* Facebook */}
      <PlatformCard
        icon={<Facebook className="h-4 w-4 text-blue-600" />}
        name="Facebook"
        color="bg-blue-50"
        profileUrl={fb?.pageUrl}
        available={fbAvailable}
        stats={[
          { label: 'Likes', value: fmt(fb?.likes) },
          { label: 'Followers', value: fmt(fb?.followers) },
          { label: 'Talking', value: fmt(fb?.talkingAbout) },
        ]}
        description={fb?.description}
      />

      {/* LinkedIn */}
      <PlatformCard
        icon={<Linkedin className="h-4 w-4 text-sky-700" />}
        name="LinkedIn"
        color="bg-sky-50"
        profileUrl={li?.pageUrl}
        available={liAvailable}
        stats={[
          { label: 'Followers', value: fmt(li?.followers) },
          { label: 'Employees', value: li?.employees != null ? `${fmt(li.employees)}+` : '—' },
          { label: 'Industry', value: li?.industry?.slice(0, 14) ?? '—' },
        ]}
        description={li?.description}
        extras={
          li?.companyName ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{li.companyName}</span>
            </div>
          ) : null
        }
      />

      {/* Summary row */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: <Users className="h-3.5 w-3.5" />, label: 'IG Followers', value: fmt(ig?.followers), color: 'text-pink-600' },
          { icon: <FileText className="h-3.5 w-3.5" />, label: 'FB Likes', value: fmt(fb?.likes), color: 'text-blue-600' },
          { icon: <UserCheck className="h-3.5 w-3.5" />, label: 'LI Followers', value: fmt(li?.followers), color: 'text-sky-700' },
        ].map(item => (
          <div key={item.label} className="space-y-0.5">
            <div className={cn('flex justify-center', item.color)}>{item.icon}</div>
            <p className="text-sm font-bold text-slate-800">{item.value}</p>
            <p className="text-[10px] text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

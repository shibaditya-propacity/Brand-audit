import { buildSharedContext } from './shared';

export function buildD3Prompt(
  developer: {
    brandName: string;
    positioning?: string | null;
    city?: string | null;
    targetSegments: string[];
    websiteUrl?: string | null;
    instagramHandle?: string | null;
    facebookUrl?: string | null;
    linkedinUrl?: string | null;
    youtubeUrl?: string | null;
  },
  instagramData: unknown,
  facebookData: unknown,
  linkedinData: unknown,
  youtubeData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(
    developer.brandName,
    developer.positioning || '',
    developer.city || '',
    developer.targetSegments,
    developer.websiteUrl,
    auditDate
  );

  return `${sharedCtx}

You are auditing the Social Media dimension (D3) for ${developer.brandName}.

INSTAGRAM (handle: ${developer.instagramHandle || 'not provided'}):
${instagramData ? JSON.stringify(instagramData, null, 2) : 'null'}

FACEBOOK (url: ${developer.facebookUrl || 'not provided'}):
${facebookData ? JSON.stringify(facebookData, null, 2) : 'null'}

LINKEDIN (url: ${developer.linkedinUrl || 'not provided'}):
${linkedinData ? JSON.stringify(linkedinData, null, 2) : 'null'}

YOUTUBE (url: ${developer.youtubeUrl || 'not provided'}):
${youtubeData ? JSON.stringify(youtubeData, null, 2) : 'null'}

Scoring guide for D3:
- Any active presence on 2+ platforms = 40+
- Instagram 5K+ followers + Facebook 1K+ likes + LinkedIn company page = 60+
- Strong engagement, consistent content, verified/business accounts across platforms = 75+
- YouTube channel with 1K+ subscribers, regular uploads, project walkthroughs = +10 pts
- Indian real estate context: Instagram is primary; LinkedIn matters for B2B trust; Facebook for local reach; YouTube for long-form project credibility and buyer trust

CRITICAL: Only evaluate items for which you have actual data in the JSON above.
If a platform's data is null, set every item depending on it to status "na" and finding "Data unavailable — cannot evaluate".
Do NOT infer metrics. Do NOT use "partial" as a substitute for missing data.

Evaluate checklist items D3-1 through D3-20. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences — only reference data you actually have>",
  "items": [{ "code": "D3-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite actual metrics or 'Data unavailable'>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "Instagram"|"Facebook"|"LinkedIn"|"YouTube"|"Manual", "sourceUrl": "<direct URL to profile/post proving this finding, or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "platformBreakdown": {
    "instagram": { "followers": <number|null>, "posts": <number|null>, "active": <true|false|null> },
    "facebook": { "likes": <number|null>, "followers": <number|null>, "active": <true|false|null> },
    "linkedin": { "followers": <number|null>, "employees": <number|null>, "active": <true|false|null> },
    "youtube": { "subscribers": <number|null>, "totalVideos": <number|null>, "avgViewsPerVideo": <number|null>, "uploadFrequencyPerMonth": <number|null>, "active": <true|false|null> }
  }
}

YouTube checklist items guide (D3-14 to D3-20):
- D3-14: Channel exists and has videos published in last 60 days → pass if active, fail if no recent uploads, na if no data
- D3-15: Subscribers > 1,000 → pass if >=1000, fail if <1000, na if null
- D3-16: Upload frequency >= 2 videos/month → pass if uploadFrequencyPerMonth >= 2, fail if less
- D3-17: Content includes project walkthroughs, site visits, or testimonials → qualitative from recentVideos titles
- D3-18: Average views per video > 500 → pass if avgViewsPerVideo > 500, fail if less
- D3-19: Channel branding complete (name matches brand, description present) → qualitative from channelName + description
- D3-20: Video titles use location/project keywords for SEO → qualitative from recentVideos titles`;
}

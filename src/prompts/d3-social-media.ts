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
  },
  instagramData: unknown,
  facebookData: unknown,
  linkedinData: unknown,
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

Scoring guide for D3:
- Any active presence on 2+ platforms = 40+
- Instagram 5K+ followers + Facebook 1K+ likes + LinkedIn company page = 60+
- Strong engagement, consistent content, verified/business accounts across platforms = 75+
- Indian real estate context: Instagram is primary; LinkedIn matters for B2B trust; Facebook for local reach

CRITICAL: Only evaluate items for which you have actual data in the JSON above.
If a platform's data is null, set every item depending on it to status "na" and finding "Data unavailable — cannot evaluate".
Do NOT infer metrics. Do NOT use "partial" as a substitute for missing data.

Evaluate checklist items D3-1 through D3-13. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences — only reference data you actually have>",
  "items": [{ "code": "D3-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite actual metrics or 'Data unavailable'>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "Instagram"|"Facebook"|"LinkedIn"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "platformBreakdown": {
    "instagram": { "followers": <number|null>, "posts": <number|null>, "active": <true|false|null> },
    "facebook": { "likes": <number|null>, "followers": <number|null>, "active": <true|false|null> },
    "linkedin": { "followers": <number|null>, "employees": <number|null>, "active": <true|false|null> }
  }
}`;
}

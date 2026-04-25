import { buildSharedContext } from './shared';

export function buildD10Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; promoterName?: string | null; promoterLinkedIn?: string | null },
  websiteContent: unknown,
  pdlData: unknown,
  promoterLinkedInData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Promoter Brand dimension (D10) for ${developer.brandName}.

PROMOTER NAME: ${developer.promoterName || 'Not provided'}
PROMOTER LINKEDIN URL: ${developer.promoterLinkedIn || 'Not provided'}

PROMOTER PERSONAL LINKEDIN DATA (fetched from their LinkedIn profile):
${promoterLinkedInData ? JSON.stringify(promoterLinkedInData, null, 2) : 'Not available — LinkedIn URL not provided or data could not be fetched'}

WEBSITE CONTENT (for promoter visibility on brand website):
${JSON.stringify(websiteContent, null, 2)}

PDL COMPANY DATA (may include employee/leadership info):
${JSON.stringify(pdlData, null, 2)}

CRITICAL: Only evaluate items for which you have actual data. If all three data sources are null/unavailable, set every item to status "na". Do NOT infer promoter credibility from the brand name alone.

Scoring guide for D10:
- Named promoter with a LinkedIn profile + basic activity = 50+
- Active LinkedIn (regular posts, 1K+ followers), media mentions = 60-70
- Strong industry presence, publications, speaking engagements, 5K+ followers = 75-85
- Nationally known thought leader with verified credentials = 85+

Key items to evaluate using LinkedIn data: follower count, headline/role credibility, activity/posting frequency, professional network quality, industry recognition.

Evaluate checklist items D10-1 through D10-10. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D10-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<finding or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "LinkedIn"|"WebCrawler"|"PDL"|"Manual", "sourceUrl": "<direct URL proving this finding, or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

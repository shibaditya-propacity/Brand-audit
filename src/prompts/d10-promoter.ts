import { buildSharedContext } from './shared';

export function buildD10Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; promoterName?: string | null; promoterLinkedIn?: string | null },
  websiteContent: unknown,
  pdlData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Promoter Brand dimension (D10) for ${developer.brandName}.

PROMOTER NAME: ${developer.promoterName || 'Not provided'}
PROMOTER LINKEDIN: ${developer.promoterLinkedIn || 'Not provided'}

WEBSITE CONTENT (for promoter visibility):
${JSON.stringify(websiteContent, null, 2)}

PDL DATA (may include employee info):
${JSON.stringify(pdlData, null, 2)}

CRITICAL: Only evaluate items for which you have actual data. If website content and PDL data are both null, set every item to status "na" and finding "Promoter data unavailable — cannot evaluate". Do NOT infer promoter credibility from the brand name alone.

Scoring guide for D10: A named promoter with any online presence = 50+. Active LinkedIn, media mentions, industry credibility, visible leadership = 65-80.

Evaluate checklist items D10-1 through D10-10. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D10-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<finding or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "WebCrawler"|"PDL"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

import { buildSharedContext } from './shared';

export function buildD6Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null },
  websiteContent: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Collateral dimension (D6) for ${developer.brandName}.

WEBSITE CONTENT (for detecting brochures, press, downloads):
${JSON.stringify(websiteContent, null, 2)}

CRITICAL: Only evaluate items for which you have actual website content data. If website content is null/empty, set every item to status "na" and finding "Website content unavailable — cannot evaluate". Do NOT assume collateral exists offline.

Scoring guide for D6: A website with project brochures, floor plans, or downloadable content = 50+. Well-produced collateral, virtual tours, video walkthroughs = 65-75.

Evaluate checklist items D6-1 through D6-10. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D6-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<specific finding or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "WebCrawler"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

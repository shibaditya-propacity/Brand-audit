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

Evaluate checklist items D6-1 through D6-10. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D6-1", "status": "pass"|"fail"|"partial", "finding": "<specific finding>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "WebCrawler"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

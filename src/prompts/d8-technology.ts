import { buildSharedContext } from './shared';

export function buildD8Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; crmTool?: string | null },
  websiteContent: unknown,
  technicalSeo: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Technology dimension (D8) for ${developer.brandName}.

CRM TOOL STATED: ${developer.crmTool || 'Not provided'}

WEBSITE TECHNOLOGY DATA:
${JSON.stringify(websiteContent, null, 2)}

TECHNICAL SEO (reveals tech stack):
${JSON.stringify(technicalSeo, null, 2)}

CRITICAL: Only evaluate items for which you have actual data. If website content and technical SEO data are both null, set every item to status "na" and finding "Tech data unavailable — cannot evaluate". Do NOT infer tool usage from brand name or market segment.

Scoring guide for D8: Using any CRM + having Google Analytics on the website = 50+. Modern CRM, marketing automation, lead tracking, WhatsApp integration = 65-80.

Evaluate checklist items D8-1 through D8-12. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D8-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<finding or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "WebCrawler"|"DataForSEO"|"Manual", "sourceUrl": "<direct URL proving this finding, or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

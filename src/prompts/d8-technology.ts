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

Evaluate checklist items D8-1 through D8-12. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D8-1", "status": "pass"|"fail"|"partial", "finding": "<finding>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "WebCrawler"|"DataForSEO"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

import { buildSharedContext } from './shared';

export function buildD8Prompt(
  developer: {
    brandName: string;
    positioning?: string | null;
    city?: string | null;
    targetSegments: string[];
    websiteUrl?: string | null;
    crmTool?: string | null;
    adPlatforms?: string[];
    whatsappNumber?: string | null;
  },
  websiteContent: unknown,
  technicalSeo: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);

  const adPlatforms = (developer.adPlatforms ?? []).join(', ') || 'Not stated';
  const whatsapp = developer.whatsappNumber ? `Yes — ${developer.whatsappNumber}` : 'Not provided';

  return `${sharedCtx}

You are auditing the Technology dimension (D8) for ${developer.brandName}.

DEVELOPER-STATED TECHNOLOGY INPUTS (treat as ground truth for qualitative items):
- CRM tool: ${developer.crmTool || 'Not stated'}
- Ad platforms: ${adPlatforms}
- WhatsApp Business number: ${whatsapp}
- Website URL: ${developer.websiteUrl || 'Not provided'}

WEBSITE TECHNOLOGY DATA (from web crawler — may be null):
${JSON.stringify(websiteContent, null, 2)}

TECHNICAL SEO DATA (reveals tech stack — may be null):
${JSON.stringify(technicalSeo, null, 2)}

EVALUATION RULES:
1. Items D8-1 (CRM in use), D8-2 (lead SLA), D8-3 (nurturing), D8-7 (conversion tracking), D8-8 (GSC), D8-12 (WhatsApp) are QUALITATIVE — evaluate them from the stated inputs above. Only mark "na" if there is truly zero information to make a judgment.
2. Items D8-4 (tech stack), D8-5 (GTM), D8-6 (chat widget), D8-9 (Pixel), D8-10 (virtual tour), D8-11 (construction updates) are VERIFIABLE from scraped data — mark "na" only when scraped data is completely absent.
3. A stated CRM tool = D8-1 pass. A WhatsApp number = D8-12 partial (has WhatsApp, automation not confirmed). Meta in ad platforms + Pixel absent from crawl = D8-9 fail.
4. Do NOT mark qualitative items "na" simply because scraped data is missing.

Scoring guide for D8: Stated CRM + WhatsApp = 40+. Add Google Analytics / Pixel evidence = 55+. Modern CRM with automation, GTM, chat widget = 65-80.

Evaluate checklist items D8-1 through D8-12. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D8-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<finding>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "DevInput"|"WebCrawler"|"DataForSEO"|"Manual", "sourceUrl": "<URL or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

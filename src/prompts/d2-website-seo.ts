import { buildSharedContext } from './shared';

export function buildD2Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null },
  websiteContent: unknown,
  serpData: unknown,
  backlinksData: unknown,
  technicalSeo: unknown,
  screenshotUrl: string | null,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Website & SEO dimension (D2) for ${developer.brandName}.

WEBSITE CRAWL DATA:
${JSON.stringify(websiteContent, null, 2)}

SEO METRICS:
${JSON.stringify({ serpData, backlinksData }, null, 2)}

TECHNICAL SEO:
${JSON.stringify(technicalSeo, null, 2)}

${screenshotUrl ? `WEBSITE SCREENSHOT: ${screenshotUrl} (use this URL to visually assess design quality)` : ''}

Evaluate checklist items D2-1 through D2-17. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D2-1", "status": "pass"|"fail"|"partial", "finding": "<cite actual data>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "DataForSEO"|"WebCrawler"|"GooglePlaces"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

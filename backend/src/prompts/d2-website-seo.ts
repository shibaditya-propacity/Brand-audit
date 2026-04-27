import { buildSharedContext, summarizeSerp } from './shared';

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
  const serpSummary = summarizeSerp(serpData);

  // Slim down websiteContent — cap large text fields to avoid bloating the prompt
  const wc = websiteContent as Record<string, unknown> | null;
  const wcSummary = wc ? {
    pages: wc.pages,
    titles: (wc.titles as string[] | undefined)?.slice(0, 10),
    h1Tags: (wc.h1Tags as string[] | undefined)?.slice(0, 10),
    h2Tags: (wc.h2Tags as string[] | undefined)?.slice(0, 15),
    ctasFound: wc.ctasFound,
    hasLeadForm: wc.hasLeadForm,
    hasAnalytics: wc.hasAnalytics,
    hasFacebookPixel: wc.hasFacebookPixel,
    contentSummary: typeof wc.contentSummary === 'string' ? wc.contentSummary.slice(0, 2000) : wc.contentSummary,
  } : null;

  return `${sharedCtx}

You are auditing the Website & SEO dimension (D2) for ${developer.brandName}.

WEBSITE CRAWL DATA:
${JSON.stringify(wcSummary, null, 2)}

SEO METRICS (top 5 organic results + knowledge graph):
${JSON.stringify({ serpSummary, backlinksData }, null, 2)}

TECHNICAL SEO:
${JSON.stringify(technicalSeo, null, 2)}

${screenshotUrl ? `WEBSITE SCREENSHOT URL: ${screenshotUrl}` : ''}

Scoring guide for D2: A working website with basic pages and some SEO presence = 45-55. Good structure, mobile-friendly, active blog = 65-75.

IMPORTANT — keep findings and recommendations to ONE short sentence each (under 15 words). This is critical to avoid truncation.

Evaluate ALL 17 checklist items D2-1 through D2-17. Return this exact JSON (no extra text):
{
  "score": <number 0-100>,
  "summary": "<2 sentences max>",
  "items": [
    { "code": "D2-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<one short sentence>", "recommendation": "<one short sentence>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "DataForSEO"|"WebCrawler"|"Manual", "sourceUrl": null }
  ],
  "criticalFlags": ["<max 2 items>"],
  "strengths": ["<3-5 items>"],
  "quickWins": ["<2-3 items>"]
}`;
}

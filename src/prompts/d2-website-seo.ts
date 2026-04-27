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

${screenshotUrl ? `WEBSITE SCREENSHOT: ${screenshotUrl} (use this URL to visually assess design quality)` : ''}

CRITICAL: Only evaluate items for which you have actual data. If website content, SEO, or screenshot data is null/unavailable, set every dependent item to status "na" and finding "Data unavailable — cannot evaluate". Do NOT infer or estimate.

Scoring guide for D2: A working website with basic pages and some SEO presence = 45-55. Good structure, mobile-friendly, active blog, decent backlinks = 65-75.

Evaluate checklist items D2-1 through D2-17. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D2-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite actual data or 'Data unavailable'>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "DataForSEO"|"WebCrawler"|"GooglePlaces"|"Manual", "sourceUrl": "<direct URL proving this finding, or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

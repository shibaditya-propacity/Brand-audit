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

  // websiteContent is the already-extracted insights object (pages, titles, h1Tags, etc.)
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

  // Infer SSL from website URL
  const sslPass = developer.websiteUrl?.startsWith('https://') ?? null;

  return `${sharedCtx}

You are auditing the Website & SEO dimension (D2) for ${developer.brandName}.

WEBSITE URL: ${developer.websiteUrl || 'not provided'}
SSL (HTTPS): ${sslPass === true ? 'YES — website uses HTTPS' : sslPass === false ? 'NO — website uses HTTP only' : 'unknown'}

WEBSITE CRAWL DATA (from WebCrawler):
${wcSummary ? JSON.stringify(wcSummary, null, 2) : 'null — website crawl did not return content'}

SEO / SERP DATA (from Google search via Serper):
${JSON.stringify(serpSummary ?? null, null, 2)}

BACKLINK DATA: ${backlinksData ? JSON.stringify(backlinksData, null, 2) : 'null — not available'}

TECHNICAL SEO (on-page audit): ${technicalSeo ? JSON.stringify(technicalSeo, null, 2) : 'null — not available'}

${screenshotUrl ? `SCREENSHOT URL (for reference): ${screenshotUrl}` : ''}

DATA SOURCE GUIDE — use this to decide what you CAN evaluate:
- D2-1 (website live): evaluate if pages > 0 in crawl data, or if SERP shows the site; else "na"
- D2-2 (SSL): PASS if SSL field above says YES; FAIL if it says NO; else "na"
- D2-3 (mobile responsive): evaluate from crawl contentSummary/h2Tags if present; else "partial"
- D2-4 (CTA above fold): evaluate from ctasFound in crawl data; fail if empty, pass if relevant keywords found
- D2-5 (lead form): evaluate from hasLeadForm in crawl data; "na" only if crawl is null
- D2-6 (WhatsApp/call): look for "whatsapp" or phone patterns in ctasFound/contentSummary
- D2-7 (project pages): evaluate qualitatively from contentSummary and page count; "partial" if pages > 3
- D2-8 (About Us): look for "about" in titles/h2Tags/contentSummary
- D2-9 (testimonials): look for "testimonial", "review", "client" in contentSummary/h2Tags
- D2-10 (brand keyword ranking): evaluate from SERP topOrganic — what position does the brand website appear?
- D2-11 (backlinks): "na" — backlink data not available in this audit
- D2-12 (meta descriptions): evaluate from SERP snippets — do the snippets look like well-crafted meta descriptions?
- D2-13 (broken links): "na" — technical SEO data not available
- D2-14 (H1 tags): evaluate from h1Tags in crawl data; "na" only if crawl is null
- D2-15 (page load speed): "na" — speed test data not available
- D2-16 (analytics tracking): evaluate from hasAnalytics in crawl data; "na" only if crawl is null
- D2-17 (Facebook pixel): evaluate from hasFacebookPixel in crawl data; "na" only if crawl is null

SCORING GUIDE: A working website with HTTPS, basic pages, and some SERP presence = 45-55. Good structure, CTAs, lead form, analytics, active content = 65-75. Strong SEO ranking, rich content, verified tracking = 75+.

Evaluate ALL items D2-1 through D2-17. Use "na" ONLY when the specific data source is completely absent (e.g., crawl is null, SERP is null). Do NOT default to "na" — use "partial" or "fail" when you have any signal at all. Return this exact JSON with no extra text:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences citing actual data points>",
  "items": [{ "code": "D2-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite specific data — never say Data unavailable if you have any signal>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "DataForSEO"|"WebCrawler"|"Manual", "sourceUrl": "<URL or null>" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

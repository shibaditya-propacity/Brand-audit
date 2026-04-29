import axios from 'axios';
import { withRetry } from '@/lib/fetchWithRetry';
import type { WebCrawlerResponse, WebCrawlerPage } from '@/types/apiResponses';

const WC_BASE = 'https://api.webcrawlerapi.com/v1';

const wcClient = axios.create({
  baseURL: WC_BASE,
  timeout: 15000,
  headers: { Authorization: `Bearer ${process.env.WEBCRAWLER_API_KEY}` },
});

export async function startCrawl(url: string): Promise<string> {
  const response = await withRetry(() =>
    wcClient.post('/crawl', { url, max_pages: 20, output_format: 'markdown' })
  );
  return response.data.id;
}

export async function getCrawlStatus(jobId: string): Promise<WebCrawlerResponse> {
  let data;
  try {
    const response = await wcClient.get(`/crawl/${jobId}`);
    data = response.data;
  } catch {
    const response = await wcClient.get(`/scrape/${jobId}`);
    data = response.data;
  }
  return {
    job_id: data.id,
    status: data.status as WebCrawlerResponse['status'],
    total_pages: data.page_count || 1,
    _markdownUrl: data.structured_data?.markdown_content_url
      ?? data.markdown_url
      ?? data.result_url
      ?? null,
  } as WebCrawlerResponse & { _markdownUrl?: string | null };
}

export async function pollCrawlUntilDone(jobId: string, maxWaitMs = 90000): Promise<WebCrawlerResponse> {
  const start = Date.now();
  let consecutiveDoneWithoutUrl = 0;

  while (Date.now() - start < maxWaitMs) {
    const status = await getCrawlStatus(jobId) as WebCrawlerResponse & { _markdownUrl?: string | null };
    if (status.status === 'failed') return status;

    if (status.status === 'done') {
      if (status._markdownUrl) {
        try {
          const mdRes = await axios.get<string>(status._markdownUrl, { timeout: 15000 });
          const markdown = mdRes.data || '';
          const page = markdownToPage(markdown);
          return { ...status, pages: [page] };
        } catch (err) {
          console.error('[webCrawler] Failed to fetch markdown URL:', err instanceof Error ? err.message : err);
          return status;
        }
      }
      consecutiveDoneWithoutUrl++;
      if (consecutiveDoneWithoutUrl >= 3) {
        console.warn('[webCrawler] Crawl done but no markdown URL after 3 retries');
        return status;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  console.warn('[webCrawler] Crawl timed out');
  return { job_id: jobId, status: 'failed', total_pages: 0 } as WebCrawlerResponse;
}

function markdownToPage(markdown: string): WebCrawlerPage {
  const lines = markdown.split('\n');
  const h1 = lines.filter(l => /^# /.test(l)).map(l => l.replace(/^# /, '').trim());
  const h2 = lines.filter(l => /^## /.test(l)).map(l => l.replace(/^## /, '').trim());
  const title = h1[0] || '';
  const metaLine = lines.find(l => l.toLowerCase().includes('description:'));
  return {
    url: '',
    title,
    meta_description: metaLine?.replace(/.*description:/i, '').trim(),
    content: markdown,
    headings: { h1, h2 },
    status_code: 200,
  };
}

// ── Direct website fetch fallback ──────────────────────────────────────────────
// Used when the WebCrawler API is unavailable (no balance, API error, etc.)
// Fetches the homepage directly and extracts key SEO/content signals.

async function fetchWebsiteDirect(websiteUrl: string): Promise<WebCrawlerPage | null> {
  try {
    const response = await axios.get<string>(websiteUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
    });

    const html = response.data as string;

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() || '';

    // Meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{5,300})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{5,300})["'][^>]+name=["']description["']/i);
    const metaDesc = metaMatch?.[1]?.trim() || '';

    // H1 tags (strip inner HTML tags)
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h1 = h1Matches.map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 5);

    // H2 tags
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    const h2 = h2Matches.map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 10);

    // Strip scripts/styles then convert to readable text for content analysis
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
    const textContent = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    return {
      url: websiteUrl,
      title,
      meta_description: metaDesc,
      content: textContent,
      headings: { h1, h2 },
      status_code: response.status,
    };
  } catch (err) {
    console.error('[webCrawler] Direct fetch failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export function extractWebsiteInsights(pages: WebCrawlerPage[]) {
  const ctaPatterns = /\b(book|enquire|enquiry|contact|call|whatsapp|download|get quote|schedule|visit|register|apply)\b/gi;
  const formPatterns = /<form|contact form|enquiry form|\bform\b/gi;
  const analyticsPatterns = /gtag|GA4|google-analytics|googletagmanager|fbq|pixel/gi;
  const pixelPatterns = /fbq|facebook pixel|meta pixel/gi;
  const whatsappPatterns = /whatsapp|wa\.me|click.to.call|\+91\s*\d{10}/gi;

  const allContent = pages.map(p => p.content || '').join('\n');
  const allTitles = pages.map(p => p.title).filter(Boolean);
  const allH1 = pages.flatMap(p => p.headings?.h1 || []);
  const allH2 = pages.flatMap(p => p.headings?.h2 || []);
  const allMetaDesc = pages.map(p => p.meta_description).filter(Boolean);

  const ctaMatches = Array.from(new Set(allContent.match(ctaPatterns) || []));
  const hasForm = formPatterns.test(allContent);
  const hasAnalytics = analyticsPatterns.test(allContent);
  const hasPixel = pixelPatterns.test(allContent);
  const hasWhatsapp = whatsappPatterns.test(allContent);

  return {
    pages: pages.length,
    titles: allTitles,
    metaDescriptions: allMetaDesc,
    h1Tags: allH1,
    h2Tags: allH2,
    ctasFound: ctaMatches,
    hasLeadForm: hasForm,
    hasWhatsapp,
    hasAnalytics,
    hasFacebookPixel: hasPixel,
    contentSummary: allContent.substring(0, 5000),
  };
}

// ── Public entry point used by collect/website route ──────────────────────────
// Tries WebCrawler API first; falls back to direct homepage fetch automatically.

export async function crawlWebsite(websiteUrl: string): Promise<ReturnType<typeof extractWebsiteInsights> | null> {
  // 1. Try WebCrawler API
  try {
    const jobId = await startCrawl(websiteUrl);
    const crawlResult = await pollCrawlUntilDone(jobId) as WebCrawlerResponse & { _markdownUrl?: string | null };

    if (crawlResult.pages && crawlResult.pages.length > 0) {
      const insights = extractWebsiteInsights(crawlResult.pages);
      if (insights.pages > 0 && (insights.contentSummary.length > 100 || insights.h1Tags.length > 0)) {
        console.log('[webCrawler] WebCrawler API succeeded with', insights.pages, 'pages');
        return insights;
      }
    }
    console.warn('[webCrawler] WebCrawler API returned no usable content — falling back to direct fetch');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[webCrawler] WebCrawler API failed:', msg, '— falling back to direct fetch');
  }

  // 2. Direct homepage fetch fallback
  const page = await fetchWebsiteDirect(websiteUrl);
  if (page) {
    console.log('[webCrawler] Direct fetch succeeded for', websiteUrl);
    return extractWebsiteInsights([page]);
  }

  return null;
}

import axios from 'axios';
import type { WebCrawlerResponse, WebCrawlerPage } from '@/types/apiResponses';

const WC_BASE = 'https://webcrawlerapi.com/api/v1';

const wcClient = axios.create({
  baseURL: WC_BASE,
  headers: { 'X-Access-Token': process.env.WEBCRAWLER_API_KEY },
});

export async function startCrawl(url: string): Promise<string> {
  const response = await wcClient.post('/crawl', {
    url,
    max_pages: 20,
    output_format: 'markdown',
  });
  return response.data.job_id || response.data.id;
}

export async function getCrawlStatus(jobId: string): Promise<WebCrawlerResponse> {
  const response = await wcClient.get(`/crawl/${jobId}`);
  return response.data;
}

export async function pollCrawlUntilDone(jobId: string, maxWaitMs = 120000): Promise<WebCrawlerResponse> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await getCrawlStatus(jobId);
    if (status.status === 'done' || status.status === 'failed') return status;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new Error('Crawl timed out');
}

export function extractWebsiteInsights(pages: WebCrawlerPage[]) {
  const ctaPatterns = /\b(book|enquire|enquiry|contact|call|whatsapp|download|get quote|schedule|visit|register|apply)\b/gi;
  const formPatterns = /<form|contact form|enquiry form/gi;
  const analyticsPatterns = /gtag|GA4|google-analytics|googletagmanager|fbq|pixel/gi;
  const pixelPatterns = /fbq|facebook pixel|meta pixel/gi;

  const allContent = pages.map(p => p.content || '').join('\n');
  const allTitles = pages.map(p => p.title).filter(Boolean);
  const allH1 = pages.flatMap(p => p.headings?.h1 || []);
  const allH2 = pages.flatMap(p => p.headings?.h2 || []);

  const ctaMatches = Array.from(new Set(allContent.match(ctaPatterns) || []));
  const hasForm = formPatterns.test(allContent);
  const hasAnalytics = analyticsPatterns.test(allContent);
  const hasPixel = pixelPatterns.test(allContent);

  return {
    pages: pages.length,
    titles: allTitles,
    h1Tags: allH1,
    h2Tags: allH2,
    ctasFound: ctaMatches,
    hasLeadForm: hasForm,
    hasAnalytics,
    hasFacebookPixel: hasPixel,
    contentSummary: allContent.substring(0, 5000),
  };
}

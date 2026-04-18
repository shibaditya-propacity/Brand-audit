import axios from 'axios';
import type { WebCrawlerResponse, WebCrawlerPage } from '@/types/apiResponses';

const WC_BASE = 'https://api.webcrawlerapi.com/v1';

const wcClient = axios.create({
  baseURL: WC_BASE,
  headers: { Authorization: `Bearer ${process.env.WEBCRAWLER_API_KEY}` },
});

export async function startCrawl(url: string): Promise<string> {
  const response = await wcClient.post('/crawl', {
    url,
    max_pages: 20,
    output_format: 'markdown',
  });
  return response.data.id;
}

export async function getCrawlStatus(jobId: string): Promise<WebCrawlerResponse> {
  const response = await wcClient.get(`/scrape/${jobId}`);
  const data = response.data;
  return {
    job_id: data.id,
    status: data.status as WebCrawlerResponse['status'],
    total_pages: data.page_count || 1,
    _markdownUrl: data.structured_data?.markdown_content_url,
  } as WebCrawlerResponse & { _markdownUrl?: string };
}

export async function pollCrawlUntilDone(jobId: string, maxWaitMs = 120000): Promise<WebCrawlerResponse> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await getCrawlStatus(jobId) as WebCrawlerResponse & { _markdownUrl?: string };
    if (status.status === 'failed') return status;

    if (status.status === 'done' && status._markdownUrl) {
      const mdRes = await axios.get<string>(status._markdownUrl);
      const markdown = mdRes.data || '';
      const page = markdownToPage(markdown);
      return { ...status, pages: [page] };
    }

    await new Promise(resolve => setTimeout(resolve, status._markdownUrl ? 2000 : 3000));
  }
  throw new Error('Crawl timed out');
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

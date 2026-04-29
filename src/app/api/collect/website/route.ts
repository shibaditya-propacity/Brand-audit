import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { startCrawl, pollCrawlUntilDone, extractWebsiteInsights } from '@/lib/apis/webCrawler';

export const maxDuration = 150;

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, auditId } = await request.json();
    if (!websiteUrl) {
      return NextResponse.json({ success: false, data: null, error: 'websiteUrl required' });
    }

    let insights = null;
    let pageCount = 0;

    try {
      const jobId = await startCrawl(websiteUrl);
      const crawlResult = await pollCrawlUntilDone(jobId);
      if (crawlResult.pages && crawlResult.pages.length > 0) {
        insights = extractWebsiteInsights(crawlResult.pages);
        pageCount = crawlResult.pages.length;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Web crawl API error:', msg);
    }

    // Fall back to cached data if crawl produced nothing
    if (!insights && auditId) {
      await connectDB();
      const existing = await Audit.findById(auditId).lean() as { collectedData?: { websiteContent?: { insights?: unknown } } } | null;
      const cached = existing?.collectedData?.websiteContent?.insights;
      if (cached) {
        console.log('[website] using cached website content');
        return NextResponse.json({ success: true, data: { insights: cached, rawPageCount: 0 }, cached: true });
      }
    }

    if (!insights) {
      return NextResponse.json({ success: false, data: null, error: 'Website crawl returned no content' });
    }

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, {
        'collectedData.websiteContent': { insights, rawPageCount: pageCount },
      });
    }

    return NextResponse.json({ success: true, data: { insights, pageCount }, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect website data';
    console.error('Website collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

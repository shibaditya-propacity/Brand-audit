import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { startCrawl, pollCrawlUntilDone, extractWebsiteInsights } from '@/lib/apis/webCrawler';

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
      insights = crawlResult.pages ? extractWebsiteInsights(crawlResult.pages) : null;
      pageCount = crawlResult.pages?.length || 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Web crawl API error:', msg);
      return NextResponse.json({ success: false, data: null, error: msg });
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

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { startCrawl, pollCrawlUntilDone, extractWebsiteInsights } from '@/lib/apis/webCrawler';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, auditId } = await request.json();
    if (!websiteUrl) return NextResponse.json({ error: 'websiteUrl required' }, { status: 400 });

    const jobId = await startCrawl(websiteUrl);
    const crawlResult = await pollCrawlUntilDone(jobId);
    const insights = crawlResult.pages ? extractWebsiteInsights(crawlResult.pages) : null;

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, {
        'collectedData.websiteContent': { insights, rawPageCount: crawlResult.pages?.length || 0 },
      });
    }

    return NextResponse.json({ insights, pageCount: crawlResult.pages?.length || 0 });
  } catch (error) {
    console.error('Website collection error:', error);
    return NextResponse.json({ error: 'Failed to collect website data' }, { status: 500 });
  }
}

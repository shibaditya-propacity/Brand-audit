import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getSerpResults, getBacklinksSummary, postOnPageTask, getOnPageResults, findDomainInSerp } from '@/lib/apis/dataForSeo';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { domain, brandName, auditId } = await request.json();

    const [serpResult, backlinksResult] = await Promise.allSettled([
      getSerpResults(brandName || domain || ''),
      domain ? getBacklinksSummary(domain) : Promise.resolve(null),
    ]);

    let technicalSeo = null;
    if (domain) {
      try {
        const taskId = await postOnPageTask(domain);
        if (taskId) {
          await new Promise(r => setTimeout(r, 15000));
          technicalSeo = await getOnPageResults(taskId);
        }
      } catch (err) {
        console.error('Technical SEO task failed:', err instanceof Error ? err.message : err);
      }
    }

    const serpData = serpResult.status === 'fulfilled' ? serpResult.value : null;
    const backlinks = backlinksResult.status === 'fulfilled' ? backlinksResult.value : null;
    const domainRanking = serpData && domain ? findDomainInSerp(serpData, domain) : null;

    // Only consider it a failure if the primary data (SERP) failed
    if (serpResult.status === 'rejected') {
      const msg = serpResult.reason instanceof Error ? serpResult.reason.message : 'SEO data collection failed';
      console.error('SEO SERP collection error:', msg);
      // Fall back to cached data if available
      if (auditId) {
        await connectDB();
        const existing = await Audit.findById(auditId).lean() as { collectedData?: { seoKeywords?: unknown } } | null;
        if (existing?.collectedData?.seoKeywords) {
          console.log('[seo] using cached SEO data');
          return NextResponse.json({ success: true, data: { serpData: existing.collectedData.seoKeywords }, cached: true });
        }
      }
      return NextResponse.json({ success: false, data: null, error: 'SEO data unavailable' });
    }

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, {
        'collectedData.seoKeywords': serpData,
        'collectedData.backlinks': backlinks,
        'collectedData.technicalSeo': technicalSeo,
      });
    }

    return NextResponse.json({
      success: true,
      data: { serpData, backlinks, technicalSeo, domainRanking },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect SEO data';
    console.error('SEO collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

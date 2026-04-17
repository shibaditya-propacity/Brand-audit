import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getSerpResults, getBacklinksSummary, postOnPageTask, getOnPageResults, findDomainInSerp } from '@/lib/apis/dataForSeo';

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
        console.error('Technical SEO task failed:', err);
      }
    }

    const serpData = serpResult.status === 'fulfilled' ? serpResult.value : null;
    const backlinks = backlinksResult.status === 'fulfilled' ? backlinksResult.value : null;
    const domainRanking = serpData && domain ? findDomainInSerp(serpData, domain) : null;

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, {
        'collectedData.seoKeywords': serpData,
        'collectedData.backlinks': backlinks,
        'collectedData.technicalSeo': technicalSeo,
      });
    }

    return NextResponse.json({ serpData, backlinks, technicalSeo, domainRanking });
  } catch (error) {
    console.error('SEO collection error:', error);
    return NextResponse.json({ error: 'Failed to collect SEO data' }, { status: 500 });
  }
}

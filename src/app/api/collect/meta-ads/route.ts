import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getMetaAds, analyzeMetaAds } from '@/lib/apis/metaAdLibrary';

export async function POST(request: NextRequest) {
  try {
    const { brandName, auditId } = await request.json();

    let ads: Awaited<ReturnType<typeof getMetaAds>> = [];
    try {
      ads = await getMetaAds(brandName || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Meta ads API error:', msg);
      return NextResponse.json({ success: false, data: null, error: msg });
    }

    const analysis = analyzeMetaAds(ads);
    const data = { ads, analysis };

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.metaAdsData': data });
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect Meta ads data';
    console.error('Meta ads collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

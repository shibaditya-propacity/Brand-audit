import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getMetaAds, analyzeMetaAds } from '@/lib/apis/metaAdLibrary';

export async function POST(request: NextRequest) {
  try {
    const { brandName, auditId } = await request.json();
    const ads = await getMetaAds(brandName || '');
    const analysis = analyzeMetaAds(ads);
    const data = { ads, analysis };

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.metaAdsData': data });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Meta ads collection error:', error);
    return NextResponse.json({ error: 'Failed to collect Meta ads data' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { captureScreenshot, checkClearbitLogo } from '@/lib/apis/shotApi';
export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, domain, auditId } = await request.json();

    const [screenshotResult, logoResult] = await Promise.allSettled([
      websiteUrl ? captureScreenshot(websiteUrl) : Promise.resolve(null),
      domain ? checkClearbitLogo(domain) : Promise.resolve(null),
    ]);

    const screenshotUrl = screenshotResult.status === 'fulfilled' ? screenshotResult.value : null;
    const logoUrl = logoResult.status === 'fulfilled' ? logoResult.value : null;

    if (screenshotResult.status === 'rejected') {
      console.error('Screenshot capture failed:', screenshotResult.reason);
    }
    if (logoResult.status === 'rejected') {
      console.error('Logo fetch failed:', logoResult.reason);
    }

    if (auditId && (screenshotUrl || logoUrl)) {
      await connectDB();
      const update: Record<string, string> = {};
      if (screenshotUrl) update['collectedData.screenshotUrl'] = screenshotUrl;
      if (logoUrl) update['collectedData.logoUrl'] = logoUrl;
      await Audit.findByIdAndUpdate(auditId, update);
    }
    if (!screenshotUrl && !logoUrl && (websiteUrl || domain)) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Both screenshot and logo capture failed',
      });
    }
    

    return NextResponse.json({
      success: true,
      data: { screenshotUrl, logoUrl },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect screenshots';
    console.error('Screenshot collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

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

    if (auditId) {
      await connectDB();
      const update: Record<string, string> = {};
      if (screenshotUrl) update['collectedData.screenshotUrl'] = screenshotUrl;
      if (logoUrl) update['collectedData.logoUrl'] = logoUrl;
      if (Object.keys(update).length) await Audit.findByIdAndUpdate(auditId, update);
    }

    return NextResponse.json({ screenshotUrl, logoUrl });
  } catch (error) {
    console.error('Screenshot collection error:', error);
    return NextResponse.json({ error: 'Failed to collect screenshots' }, { status: 500 });
  }
}

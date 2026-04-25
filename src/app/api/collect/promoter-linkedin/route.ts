import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { getPromoterLinkedInInsights } from '@/lib/apis/socialInsights';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    if (!auditId) {
      return NextResponse.json({ success: false, error: 'auditId required' });
    }

    await connectDB();
    const audit = await Audit.findById(auditId).lean() as { developerId: unknown } | null;
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' });
    }

    const dev = await Developer.findById(audit.developerId).lean() as {
      promoterLinkedIn?: string | null;
      promoterName?: string | null;
    } | null;

    if (!dev?.promoterLinkedIn) {
      return NextResponse.json({ success: false, error: 'No promoter LinkedIn URL provided' });
    }

    const data = await getPromoterLinkedInInsights(dev.promoterLinkedIn, dev.promoterName ?? null);

    await Audit.findByIdAndUpdate(auditId, {
      'collectedData.promoterLinkedInData': data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect promoter LinkedIn data';
    console.error('Promoter LinkedIn collection error:', msg);
    return NextResponse.json({ success: false, error: msg });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { getSocialInsights } from '@/lib/apis/socialInsights';

export async function POST(request: NextRequest) {
  try {
    const { instagramHandle, auditId } = await request.json();

    // We need either an instagramHandle or an auditId to look up the developer
    if (!instagramHandle && !auditId) {
      return NextResponse.json({ success: false, data: null, error: 'instagramHandle or auditId required' });
    }

    // If auditId provided, load developer to get all social URLs
    interface DevSocial {
      brandName: string;
      instagramHandle?: string | null;
      facebookUrl?: string | null;
      linkedinUrl?: string | null;
    }
    let dev: DevSocial | null = null;

    if (auditId) {
      await connectDB();
      const audit = await Audit.findById(auditId).lean() as { developerId: unknown } | null;
      if (audit) {
        dev = await Developer.findById(audit.developerId).lean() as DevSocial | null;
      }
    }

    // Fall back to just the instagramHandle if no dev found
    const handle = dev?.instagramHandle?.replace('@', '') ?? instagramHandle?.replace('@', '') ?? null;
    const brandName = dev?.brandName ?? handle ?? 'Unknown';

    const insights = await getSocialInsights({
      brandName,
      instagramHandle: handle,
      facebookUrl: dev?.facebookUrl ?? null,
      linkedinUrl: dev?.linkedinUrl ?? null,
    });

    const hasAnyData = insights.instagram || insights.facebook || insights.linkedin;
    if (!hasAnyData) {
      // Fall back to cached data if available
      if (auditId) {
        await connectDB();
        const existing = await Audit.findById(auditId).lean() as { collectedData?: { instagramData?: unknown } } | null;
        if (existing?.collectedData?.instagramData) {
          console.log('[instagram] using cached social data');
          return NextResponse.json({ success: true, data: { instagram: existing.collectedData.instagramData }, cached: true });
        }
      }
      return NextResponse.json({ success: false, data: null, error: 'No social data found for any platform' });
    }

    // Persist to audit
    if (auditId) {
      await connectDB();
      const update: Record<string, unknown> = {};
      if (insights.instagram) update['collectedData.instagramData'] = insights.instagram;
      if (insights.facebook) update['collectedData.facebookData'] = insights.facebook;
      if (insights.linkedin) update['collectedData.linkedinData'] = insights.linkedin;
      if (Object.keys(update).length) {
        await Audit.findByIdAndUpdate(auditId, update);
      }
    }

    return NextResponse.json({ success: true, data: insights, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect social data';
    console.error('Social collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

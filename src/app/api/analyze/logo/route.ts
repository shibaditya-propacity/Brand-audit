import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithVision } from '@/lib/anthropic';
import { buildLogoVisionPrompt } from '@/prompts/logo-vision';
import { getAuditWithDev } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId, logoUrl: providedLogoUrl } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const imageUrl = providedLogoUrl || audit.collectedData?.logoUrl;
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No logo URL available — logo analysis skipped' });
    }

    const prompt = buildLogoVisionPrompt(dev.brandName, dev.positioning || '');
    const raw = await analyzeWithVision(prompt, imageUrl);
    const analysis = JSON.parse(raw);
    return NextResponse.json({ success: true, analysis, logoUrl: imageUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Logo analysis failed';
    console.error('Logo analysis error:', msg);
    return NextResponse.json({ success: false, analysis: null, error: 'Analysis failed. Please try again.' });
  }
}

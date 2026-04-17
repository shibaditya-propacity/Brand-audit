import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithVision } from '@/lib/anthropic';
import { buildLogoVisionPrompt } from '@/prompts/logo-vision';
import { getAuditWithDev } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId, logoUrl: providedLogoUrl } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const imageUrl = providedLogoUrl || audit.collectedData?.logoUrl;
    if (!imageUrl) return NextResponse.json({ error: 'No logo URL available' }, { status: 400 });

    const prompt = buildLogoVisionPrompt(dev.brandName, dev.positioning || '');
    const raw = await analyzeWithVision(prompt, imageUrl);
    const analysis = JSON.parse(raw);
    return NextResponse.json({ analysis, logoUrl: imageUrl });
  } catch (error) {
    console.error('Logo analysis error:', error);
    return NextResponse.json({ error: 'Logo analysis failed' }, { status: 500 });
  }
}

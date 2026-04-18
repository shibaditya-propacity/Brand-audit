import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude, analyzeWithVision } from '@/lib/anthropic';
import { buildD5Prompt } from '@/prompts/d5-visual-identity';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const logoUrl: string | null = audit.collectedData?.logoUrl ?? null;
    const screenshotUrl: string | null = audit.collectedData?.screenshotUrl ?? null;
    const auditDate = new Date().toISOString().split('T')[0];
    const prompt = buildD5Prompt(dev, logoUrl, screenshotUrl, auditDate);

    // Use vision if screenshot available so Claude actually sees the website
    const raw = screenshotUrl
      ? await analyzeWithVision(prompt, screenshotUrl, 'image/png')
      : logoUrl
      ? await analyzeWithVision(prompt, logoUrl, 'image/png')
      : await analyzeWithClaude(prompt);

    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D5', findings);
    return NextResponse.json({ score, dimension: 'D5', findings });
  } catch (error) {
    console.error('D5 analysis error:', error);
    return NextResponse.json({ error: 'D5 analysis failed' }, { status: 500 });
  }
}

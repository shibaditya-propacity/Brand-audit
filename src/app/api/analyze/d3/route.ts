import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD3Prompt } from '@/prompts/d3-social-media';
import { getAuditWithDev, saveDimensionResult, buildDataAvailabilityNote } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const missing: string[] = [];
    if (!cd?.instagramData) missing.push('Instagram data (follower count, posts, engagement metrics)');
    if (!dev.pdlData) missing.push('company social profile data');

    const prompt = buildD3Prompt(dev, cd?.instagramData ?? null, dev.pdlData ?? null, auditDate)
      + buildDataAvailabilityNote(missing);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D3', findings);
    return NextResponse.json({ success: true, score, dimension: 'D3', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D3 analysis failed';
    console.error('D3 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D3', error: msg });
  }
}

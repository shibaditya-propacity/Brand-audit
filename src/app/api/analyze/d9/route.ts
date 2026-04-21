import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD9Prompt } from '@/prompts/d9-competitors';
import { getAuditWithDev, saveDimensionResult, buildDataAvailabilityNote } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const missing: string[] = [];
    if (!cd?.gmbData) missing.push('Google My Business data');
    if (!cd?.instagramData) missing.push('Instagram data');
    if (!cd?.seoKeywords) missing.push('SEO/SERP data');

    const prompt = buildD9Prompt(
      dev,
      cd?.gmbData ?? null,
      cd?.instagramData ?? null,
      cd?.seoKeywords ?? null,
      auditDate
    ) + buildDataAvailabilityNote(missing);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D9', findings);
    return NextResponse.json({ success: true, score, dimension: 'D9', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D9 analysis failed';
    console.error('D9 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D9', error: msg });
  }
}

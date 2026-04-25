import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD8Prompt } from '@/prompts/d8-technology';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const missing: string[] = [];
    if (!cd?.websiteContent) missing.push('website content / crawl data');
    if (!cd?.technicalSeo) missing.push('technical SEO data');

    const prompt = buildD8Prompt(dev, cd?.websiteContent ?? null, cd?.technicalSeo ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D8']);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D8', findings);
    return NextResponse.json({ success: true, score, dimension: 'D8', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D8 analysis failed';
    console.error('D8 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D8', error: msg });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD10Prompt } from '@/prompts/d10-promoter';
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
    if (!dev.pdlData) missing.push('company enrichment data');

    const prompt = buildD10Prompt(dev, cd?.websiteContent ?? null, dev.pdlData ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D10']);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D10', findings);
    return NextResponse.json({ success: true, score, dimension: 'D10', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D10 analysis failed';
    console.error('D10 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D10', error: msg });
  }
}

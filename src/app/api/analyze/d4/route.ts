import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGroq } from '@/lib/groq';
import { buildD4Prompt } from '@/prompts/d4-paid-media';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const missing: string[] = [];
    if (!cd?.metaAdsData) missing.push('Meta Ads Library data (ad creatives, spend, activity)');

    const prompt = buildD4Prompt(dev, cd?.metaAdsData ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D4']);

    const raw = await analyzeWithGroq(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D4', findings);
    return NextResponse.json({ success: true, score, dimension: 'D4', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D4 analysis failed';
    console.error('D4 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D4', error: 'Analysis failed. Please try again.' });
  }
}

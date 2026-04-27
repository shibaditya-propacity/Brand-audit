import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGroq } from '@/lib/groq';
import { buildD1Prompt } from '@/prompts/d1-brand-overview';
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
    if (!dev.pdlData) missing.push('company enrichment data (PDL)');
    if (!cd?.seoKeywords) missing.push('SEO/SERP data');

    if (missing.length === 2) {
      const score = await saveSkippedDimension(auditId, 'D1');
      return NextResponse.json({ success: true, score, dimension: 'D1', skipped: true });
    }

    const prompt = buildD1Prompt(dev, dev.pdlData ?? null, cd?.seoKeywords ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D1']);

    const raw = await analyzeWithGroq(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D1', findings);
    return NextResponse.json({ success: true, score, dimension: 'D1', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D1 analysis failed';
    console.error('D1 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D1', error: 'Analysis failed. Please try again.' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD7Prompt } from '@/prompts/d7-reputation';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const missing: string[] = [];
    const reviews = cd?.googleReviews as { overallRating?: number | null; fetchedCount?: number } | null | undefined;
    const hasAnyReviewData = reviews && (reviews.overallRating != null || (reviews.fetchedCount ?? 0) > 0);
    if (!cd?.gmbData && !hasAnyReviewData) missing.push('Google My Business / review data (rating, address, reviews)');
    if (!hasAnyReviewData) missing.push('Google Reviews data');

    const prompt = buildD7Prompt(dev, cd?.gmbData ?? null, cd?.googleReviews ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D7']);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D7', findings);
    return NextResponse.json({ success: true, score, dimension: 'D7', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D7 analysis failed';
    console.error('D7 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D7', error: 'Analysis failed. Please try again.' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD2Prompt } from '@/prompts/d2-website-seo';
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
    if (!cd?.seoKeywords) missing.push('SEO/SERP data');
    if (!cd?.backlinks) missing.push('backlink data');
    if (!cd?.technicalSeo) missing.push('technical SEO data');
    if (!cd?.screenshotUrl) missing.push('website screenshot');

    if (missing.length === 5) {
      const score = await saveSkippedDimension(auditId, 'D2');
      return NextResponse.json({ success: true, score, dimension: 'D2', skipped: true });
    }

    const prompt = buildD2Prompt(
      dev,
      cd?.websiteContent ?? null,
      cd?.seoKeywords ?? null,
      cd?.backlinks ?? null,
      cd?.technicalSeo ?? null,
      cd?.screenshotUrl ?? null,
      auditDate
    ) + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D2']);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D2', findings);
    return NextResponse.json({ success: true, score, dimension: 'D2', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D2 analysis failed';
    console.error('D2 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D2', error: 'Analysis failed. Please try again.' });
  }
}

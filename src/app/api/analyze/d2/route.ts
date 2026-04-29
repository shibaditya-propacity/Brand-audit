import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGroq } from '@/lib/groq';
import { buildD2Prompt } from '@/prompts/d2-website-seo';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    // Extract website insights — stored as { insights: {...}, rawPageCount: N }
    const websiteContent = (cd as unknown as Record<string, unknown>)?.websiteContent ?? null;
    const websiteInsights = (websiteContent as Record<string, unknown> | null)?.insights ?? null;

    // NOTE: backlinks and technicalSeo are always null (stub APIs) — excluded from missing
    // so they never inflate the missing count or incorrectly trigger a skip.
    const missing: string[] = [];
    if (!websiteInsights) missing.push('website crawl data');
    if (!cd?.seoKeywords) missing.push('SEO/SERP data');
    if (!cd?.screenshotUrl) missing.push('website screenshot');

    // Skip only when no primary data sources exist at all
    if (missing.length === 3) {
      const score = await saveSkippedDimension(auditId, 'D2');
      return NextResponse.json({ success: true, score, dimension: 'D2', skipped: true });
    }

    const devFields = {
      brandName: dev.brandName as string,
      positioning: (dev.positioning as string | null) ?? null,
      city: (dev.city as string | null) ?? null,
      targetSegments: (dev.targetSegments as string[]) ?? [],
      websiteUrl: (dev.websiteUrl as string | null) ?? null,
    };

    const prompt = buildD2Prompt(
      devFields,
      websiteInsights,
      cd?.seoKeywords ?? null,
      cd?.backlinks ?? null,
      cd?.technicalSeo ?? null,
      (cd as unknown as Record<string, unknown>)?.screenshotUrl as string | null ?? null,
      auditDate
    ) + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D2']);

    const raw = await analyzeWithGroq(prompt);
    let findings;
    try {
      findings = JSON.parse(raw);
    } catch {
      console.error('D2 JSON parse error. Raw response tail:', raw.slice(-300));
      throw new Error(`D2 JSON parse failed — AI returned non-JSON. Raw tail: ${raw.slice(-200)}`);
    }
    const score = await saveDimensionResult(auditId, 'D2', findings);
    return NextResponse.json({ success: true, score, dimension: 'D2', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D2 analysis failed';
    console.error('D2 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D2', error: msg });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithVision, ImageUnsupportedError } from '@/lib/anthropic';
import { analyzeWithGroq } from '@/lib/groq';
import { buildD5Prompt } from '@/prompts/d5-visual-identity';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export const maxDuration = 60;

async function runD5Analysis(prompt: string, screenshotUrl: string | null, logoUrl: string | null): Promise<string> {
  // Try screenshot first, then logo, then text-only — each with graceful fallback
  if (screenshotUrl) {
    try {
      return await analyzeWithVision(prompt, screenshotUrl, 'image/png');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[D5] screenshot vision failed, trying logo fallback:', msg);
    }
  }
  if (logoUrl) {
    try {
      return await analyzeWithVision(prompt, logoUrl, 'image/png');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[D5] logo vision failed, falling back to text-only:', msg);
    }
  }
  return await analyzeWithGroq(prompt);
}

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const logoUrl: string | null = audit.collectedData?.logoUrl ?? null;
    const screenshotUrl: string | null = audit.collectedData?.screenshotUrl ?? null;
    const auditDate = new Date().toISOString().split('T')[0];

    const missing: string[] = [];
    if (!logoUrl) missing.push('brand logo image');
    if (!screenshotUrl) missing.push('website screenshot');

    const prompt = buildD5Prompt(dev, logoUrl, screenshotUrl, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D5']);

    const raw = await runD5Analysis(prompt, screenshotUrl, logoUrl);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D5', findings);
    return NextResponse.json({ success: true, score, dimension: 'D5', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D5 analysis failed';
    console.error('D5 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D5', error: 'Analysis failed. Please try again.' });
  }
}

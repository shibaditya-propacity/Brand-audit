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

    // D8 uses developer-stated inputs (CRM, ad platforms, WhatsApp) for qualitative items
    // so it should never be fully skipped — only mark scraped-only items NA when data is absent
    const missing: string[] = [];
    if (!cd?.websiteContent) missing.push('website crawl data (D8-5, D8-6, D8-9, D8-10, D8-11 cannot be verified)');
    if (!cd?.technicalSeo) missing.push('technical SEO data (D8-4 tech stack cannot be verified)');

    const devForPrompt = {
      brandName: dev.brandName as string,
      positioning: (dev.positioning as string | null) ?? null,
      city: (dev.city as string | null) ?? null,
      targetSegments: (dev.targetSegments as string[]) ?? [],
      websiteUrl: (dev.websiteUrl as string | null) ?? null,
      crmTool: (dev.crmTool as string | null) ?? null,
      adPlatforms: (dev.adPlatforms as string[]) ?? [],
      whatsappNumber: (dev.whatsappNumber as string | null) ?? null,
    };

    const prompt = buildD8Prompt(devForPrompt, cd?.websiteContent ?? null, cd?.technicalSeo ?? null, auditDate)
      + buildDataAvailabilityNote(missing)
      + buildManualOverrideNote(manualOverrides['D8']);

    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D8', findings);
    return NextResponse.json({ success: true, score, dimension: 'D8', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D8 analysis failed';
    console.error('D8 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D8', error: 'Analysis failed. Please try again.' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD2Prompt } from '@/prompts/d2-website-seo';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;
    const prompt = buildD2Prompt(dev, cd?.websiteContent, cd?.seoKeywords, cd?.backlinks, cd?.technicalSeo, cd?.screenshotUrl ?? null, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D2', findings);
    return NextResponse.json({ score, dimension: 'D2', findings });
  } catch (error) {
    console.error('D2 analysis error:', error);
    return NextResponse.json({ error: 'D2 analysis failed' }, { status: 500 });
  }
}

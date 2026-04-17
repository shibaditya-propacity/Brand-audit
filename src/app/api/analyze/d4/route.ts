import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD4Prompt } from '@/prompts/d4-paid-media';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const prompt = buildD4Prompt(dev, audit.collectedData?.metaAdsData, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D4', findings);
    return NextResponse.json({ score, dimension: 'D4', findings });
  } catch (error) {
    console.error('D4 analysis error:', error);
    return NextResponse.json({ error: 'D4 analysis failed' }, { status: 500 });
  }
}

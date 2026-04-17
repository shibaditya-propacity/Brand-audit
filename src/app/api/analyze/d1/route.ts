import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD1Prompt } from '@/prompts/d1-brand-overview';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const prompt = buildD1Prompt(dev, dev.pdlData, audit.collectedData?.seoKeywords, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D1', findings);
    return NextResponse.json({ score, dimension: 'D1', findings });
  } catch (error) {
    console.error('D1 analysis error:', error);
    return NextResponse.json({ error: 'D1 analysis failed' }, { status: 500 });
  }
}

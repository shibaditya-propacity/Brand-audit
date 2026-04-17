import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD6Prompt } from '@/prompts/d6-collateral';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const prompt = buildD6Prompt(dev, audit.collectedData?.websiteContent, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D6', findings);
    return NextResponse.json({ score, dimension: 'D6', findings });
  } catch (error) {
    console.error('D6 analysis error:', error);
    return NextResponse.json({ error: 'D6 analysis failed' }, { status: 500 });
  }
}

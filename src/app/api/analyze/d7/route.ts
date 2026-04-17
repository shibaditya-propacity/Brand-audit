import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD7Prompt } from '@/prompts/d7-reputation';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;
    const prompt = buildD7Prompt(dev, cd?.gmbData, cd?.googleReviews, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D7', findings);
    return NextResponse.json({ score, dimension: 'D7', findings });
  } catch (error) {
    console.error('D7 analysis error:', error);
    return NextResponse.json({ error: 'D7 analysis failed' }, { status: 500 });
  }
}

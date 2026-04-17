import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD8Prompt } from '@/prompts/d8-technology';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;
    const prompt = buildD8Prompt(dev, cd?.websiteContent, cd?.technicalSeo, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D8', findings);
    return NextResponse.json({ score, dimension: 'D8', findings });
  } catch (error) {
    console.error('D8 analysis error:', error);
    return NextResponse.json({ error: 'D8 analysis failed' }, { status: 500 });
  }
}

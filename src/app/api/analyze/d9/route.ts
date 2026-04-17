import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD9Prompt } from '@/prompts/d9-competitors';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;
    const prompt = buildD9Prompt(dev, cd?.gmbData, cd?.instagramData, cd?.seoKeywords, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D9', findings);
    return NextResponse.json({ score, dimension: 'D9', findings });
  } catch (error) {
    console.error('D9 analysis error:', error);
    return NextResponse.json({ error: 'D9 analysis failed' }, { status: 500 });
  }
}

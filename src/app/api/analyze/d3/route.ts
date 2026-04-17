import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/anthropic';
import { buildD3Prompt } from '@/prompts/d3-social-media';
import { getAuditWithDev, saveDimensionResult } from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const prompt = buildD3Prompt(dev, audit.collectedData?.instagramData, dev.pdlData, auditDate);
    const raw = await analyzeWithClaude(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D3', findings);
    return NextResponse.json({ score, dimension: 'D3', findings });
  } catch (error) {
    console.error('D3 analysis error:', error);
    return NextResponse.json({ error: 'D3 analysis failed' }, { status: 500 });
  }
}

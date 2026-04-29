import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGroq } from '@/lib/groq';
import { buildD3Prompt } from '@/prompts/d3-social-media';
import { getAuditWithDev, saveDimensionResult, saveSkippedDimension, buildDataAvailabilityNote, buildManualOverrideNote } from '../_shared';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    const { audit, dev, manualOverrides } = await getAuditWithDev(auditId);
    if (!audit || !dev) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const auditDate = new Date().toISOString().split('T')[0];
    const cd = audit.collectedData;

    const cdAny = cd as unknown as Record<string, unknown>;
    const instagramData = cd?.instagramData ?? null;
    const facebookData = cdAny?.facebookData ?? null;
    const linkedinData = cdAny?.linkedinData ?? null;
    const youtubeData = cdAny?.youtubeData ?? null;

    const missing: string[] = [];
    if (!instagramData) missing.push('Instagram data');
    if (!facebookData) missing.push('Facebook data');
    if (!linkedinData) missing.push('LinkedIn data');
    if (!youtubeData) missing.push('YouTube data');

    const devWithSocials = {
      brandName: dev.brandName as string,
      positioning: (dev.positioning as string | null) ?? null,
      city: (dev.city as string | null) ?? null,
      targetSegments: (dev.targetSegments as string[]) ?? [],
      websiteUrl: (dev.websiteUrl as string | null) ?? null,
      instagramHandle: (dev.instagramHandle as string | null) ?? null,
      facebookUrl: (dev.facebookUrl as string | null) ?? null,
      linkedinUrl: (dev.linkedinUrl as string | null) ?? null,
      youtubeUrl: (dev.youtubeUrl as string | null) ?? null,
    };

    const prompt =
      buildD3Prompt(devWithSocials, instagramData, facebookData, linkedinData, youtubeData, auditDate) +
      buildDataAvailabilityNote(missing) +
      buildManualOverrideNote(manualOverrides['D3']);

    const raw = await analyzeWithGroq(prompt);
    const findings = JSON.parse(raw);
    const score = await saveDimensionResult(auditId, 'D3', findings);
    return NextResponse.json({ success: true, score, dimension: 'D3', findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'D3 analysis failed';
    console.error('D3 analysis error:', msg);
    return NextResponse.json({ success: false, score: null, dimension: 'D3', error: 'Analysis failed. Please try again.' });
  }
}

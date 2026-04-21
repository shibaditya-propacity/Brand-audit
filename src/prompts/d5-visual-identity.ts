import { buildSharedContext } from './shared';

export function buildD5Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null },
  logoUrl: string | null,
  screenshotUrl: string | null,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Visual Identity dimension (D5) for ${developer.brandName}.

${logoUrl ? `BRAND LOGO: ${logoUrl}` : 'BRAND LOGO: Not available'}
${screenshotUrl ? `WEBSITE SCREENSHOT: ${screenshotUrl}` : 'WEBSITE SCREENSHOT: Not available'}

CRITICAL: Only evaluate items for which you have actual visual assets. If logo or screenshot URLs are "Not available", set every item that depends on them to status "na" and finding "Visual asset unavailable — cannot evaluate". Do NOT infer visual quality from brand name alone.

Scoring guide for D5: A clean, professional website with consistent colors and readable typography = 50-60. Distinct logo, strong visual system, high-quality photography, brand coherence = 70-80.

Evaluate checklist items D5-1 through D5-12 based only on the assets you can actually see.

Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences about visual identity quality>",
  "items": [{ "code": "D5-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<visual observation or 'Asset unavailable'>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "Screenshot"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "logoGrade": "A"|"B"|"C"|"D"|"F",
  "visualConsistencyScore": <1-10>
}`;
}

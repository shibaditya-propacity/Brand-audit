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

Scoring guide for D5: A clean, professional website with consistent colors and readable typography = 50-60. Distinct logo, strong visual system, high-quality photography, brand coherence across touchpoints = 70-80. If assets are unavailable, mark "partial" not "fail". When you CAN see visual assets, celebrate what works — color choices, photography quality, layout clarity, modernity of design.

Based on the visual assets provided and what you can infer about this brand's positioning, evaluate checklist items D5-1 through D5-12.

Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences about visual identity quality>",
  "items": [{ "code": "D5-1", "status": "pass"|"fail"|"partial", "finding": "<visual observation>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "Screenshot"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "logoGrade": "A"|"B"|"C"|"D"|"F",
  "visualConsistencyScore": <1-10>
}`;
}

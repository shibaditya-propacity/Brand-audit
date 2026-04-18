import { buildSharedContext } from './shared';

export function buildD9Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; competitors?: string[] },
  gmbData: unknown,
  instagramData: unknown,
  serpData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Competitor Analysis dimension (D9) for ${developer.brandName}.

STATED COMPETITORS: ${developer.competitors?.join(', ') || 'Not provided'}

THIS BRAND'S GMB DATA: ${JSON.stringify(gmbData, null, 2)}
THIS BRAND'S INSTAGRAM DATA: ${JSON.stringify(instagramData, null, 2)}
THIS BRAND'S SERP DATA: ${JSON.stringify(serpData, null, 2)}

Scoring guide for D9: Having awareness of competitors and a differentiated positioning = 50+. Clear competitive advantages, strong local market presence, distinctive USPs = 65-75. If competitor data is limited, base scoring on this brand's own strengths and stated positioning. Highlight this brand's differentiators, niche strengths, and areas where it clearly stands out.

Using the stated competitors and the brand's own metrics, evaluate competitive positioning for checklist items D9-1 through D9-10.

Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences about competitive position>",
  "items": [{ "code": "D9-1", "status": "pass"|"fail"|"partial", "finding": "<evidence-based finding>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "GooglePlaces"|"HikerAPI"|"DataForSEO"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

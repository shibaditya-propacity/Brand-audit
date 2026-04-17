import { buildSharedContext } from './shared';

export function buildD3Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; instagramHandle?: string | null },
  instagramData: unknown,
  pdlData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Social Media dimension (D3) for ${developer.brandName}.

INSTAGRAM DATA (from HikerAPI):
${JSON.stringify(instagramData, null, 2)}

PDL SOCIAL LINKS:
${JSON.stringify(pdlData, null, 2)}

Instagram Handle: ${developer.instagramHandle || 'Not provided'}

Evaluate checklist items D3-1 through D3-13. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences specific to social presence>",
  "items": [{ "code": "D3-1", "status": "pass"|"fail"|"partial", "finding": "<cite actual metrics>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "HikerAPI"|"PDL"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "engagementTier": "excellent"|"good"|"average"|"poor",
  "contentQualityScore": <1-10>,
  "brandConsistencyScore": <1-10>
}`;
}

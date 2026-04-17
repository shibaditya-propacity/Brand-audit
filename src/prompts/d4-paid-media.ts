import { buildSharedContext } from './shared';

export function buildD4Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; reraNumbers?: string[] },
  metaAdsData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Paid Media dimension (D4) for ${developer.brandName}.

META AD LIBRARY DATA:
${JSON.stringify(metaAdsData, null, 2)}

RERA Numbers: ${developer.reraNumbers?.join(', ') || 'Not provided'}

Evaluate checklist items D4-1 through D4-16. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D4-1", "status": "pass"|"fail"|"partial", "finding": "<cite actual ad data>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "MetaAdLibrary"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

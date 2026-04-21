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

CRITICAL: Only evaluate items for which you have actual data. If Meta Ads data is null/empty, set every item to status "na" and finding "Ad library data unavailable — cannot evaluate". Do NOT assume ads exist that weren't captured.

Scoring guide for D4: Running any Meta ads at all = 45+. Active campaigns with varied creatives, consistent messaging, and RERA compliance = 65-75.

Evaluate checklist items D4-1 through D4-16. Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D4-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite actual ad data or 'Data unavailable'>", "recommendation": "<specific action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "MetaAdLibrary"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": []
}`;
}

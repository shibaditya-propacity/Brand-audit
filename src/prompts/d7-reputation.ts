import { buildSharedContext } from './shared';

export function buildD7Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; reraNumbers?: string[]; reraState?: string | null },
  gmbData: unknown,
  googleReviews: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Reputation & Compliance dimension (D7) for ${developer.brandName}.

GOOGLE MY BUSINESS DATA:
${JSON.stringify(gmbData, null, 2)}

GOOGLE REVIEWS DATA:
${JSON.stringify(googleReviews, null, 2)}

RERA Numbers: ${developer.reraNumbers?.join(', ') || 'Not provided'}
RERA State: ${developer.reraState || 'Not provided'}

CRITICAL: Only evaluate items for which you have actual data. If GMB or reviews data is null/unavailable, set every dependent item to status "na" and finding "GMB/review data unavailable — cannot evaluate". Do NOT assume a rating or reviews exist that weren't captured.

Scoring guide for D7: Having RERA registration + a Google My Business listing with some reviews = 50+. High rating (4+), active review responses, strong positive sentiment, clean compliance record = 70-80.

Perform sentiment analysis on the reviews and evaluate checklist items D7-1 through D7-16.

Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences>",
  "items": [{ "code": "D7-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite review data or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "GooglePlaces"|"DataForSEO"|"Manual" }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "sentimentBreakdown": { "positive": <0-100>, "negative": <0-100>, "neutral": <0-100> },
  "positiveThemes": ["<theme 1>"],
  "negativeThemes": ["<theme 1>"],
  "riskFlags": ["<risk 1>"]
}`;
}

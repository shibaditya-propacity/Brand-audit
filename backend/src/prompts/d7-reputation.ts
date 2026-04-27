import { buildSharedContext } from './shared';

export function buildD7Prompt(
  developer: {
    brandName: string;
    positioning?: string | null;
    city?: string | null;
    targetSegments: string[];
    websiteUrl?: string | null;
    reraNumbers?: string[];
    reraState?: string | null;
  },
  gmbData: unknown,
  googleReviews: unknown,   // now a ReviewSummary object, NOT a raw review array
  auditDate: string,
): string {
  const sharedCtx = buildSharedContext(
    developer.brandName,
    developer.positioning || '',
    developer.city || '',
    developer.targetSegments,
    developer.websiteUrl,
    auditDate,
  );

  // Safely cast to the summary shape to give Claude cleaner guidance
  const reviews = googleReviews as {
    source?: string;
    overallRating?: number | null;
    totalReviews?: number | null;
    fetchedCount?: number;
    ratingDistribution?: Record<string, number>;
    above4Count?: number;
    above4Pct?: number;
    avgFetchedRating?: number | null;
    responseRate?: number;
    localGuideCount?: number;
    positiveThemes?: string[];
    negativeThemes?: string[];
    recentSamples?: Array<{ rating: number; text: string; date: string; hasResponse: boolean }>;
  } | null;

  // hasReviews = true even if fetchedCount=0 as long as we have a rating (Serper fallback)
  const hasReviews = reviews && (reviews.overallRating != null || (reviews.fetchedCount ?? 0) > 0);

  const reviewsSection = hasReviews ? `
GOOGLE REVIEWS SUMMARY (aggregated from ${reviews!.fetchedCount} fetched reviews — source: ${reviews!.source}):
- Google overall rating : ${reviews!.overallRating ?? 'n/a'} ★  (${reviews!.totalReviews ?? 'n/a'} total on Google)
- Average fetched rating : ${reviews!.avgFetchedRating ?? 'n/a'} ★
- Reviews rated 4–5★    : ${reviews!.above4Count} / ${reviews!.fetchedCount} (${reviews!.above4Pct}%)
- Rating distribution   : ${JSON.stringify(reviews!.ratingDistribution)}
- Owner response rate   : ${reviews!.responseRate}%
- Local Guide reviews   : ${reviews!.localGuideCount}
- Groq-extracted positive themes : ${(reviews!.positiveThemes ?? []).join('; ') || 'none identified'}
- Groq-extracted negative themes : ${(reviews!.negativeThemes ?? []).join('; ') || 'none identified'}

SAMPLE REVIEWS (3 positive + 3 negative, text truncated to 200 chars each):
${(reviews!.recentSamples ?? []).map((s, i) =>
  `[${i + 1}] ${s.rating}★  ${s.date.slice(0, 10)}  hasResponse=${s.hasResponse}\n    "${s.text}"`
).join('\n')}
` : `
GOOGLE REVIEWS: No review data available (Apify scraper returned 0 results).
`;

  return `${sharedCtx}

You are auditing the Reputation & Compliance dimension (D7) for ${developer.brandName}.

GOOGLE MY BUSINESS DATA:
${JSON.stringify(gmbData, null, 2)}
${reviewsSection}
RERA Numbers: ${developer.reraNumbers?.join(', ') || 'Not provided'}
RERA State:   ${developer.reraState || 'Not provided'}

CRITICAL: Only evaluate items for which you have actual data. If GMB or reviews data is null/unavailable, set every dependent item to status "na" and finding "Data unavailable — cannot evaluate". Do NOT invent ratings or reviews.

Scoring guide for D7:
- Having RERA + any GMB presence = 50+
- overallRating ≥ 4.0 + above4Pct ≥ 70 + responseRate ≥ 30 = 65–75
- overallRating ≥ 4.5 + above4Pct ≥ 85 + responseRate ≥ 60 + clean RERA = 80+

Use the pre-computed stats above for your analysis — do NOT try to re-count from the samples.
The sample reviews are evidence; the aggregated numbers are the ground truth.

Perform sentiment analysis using the Groq-extracted themes and sample reviews. Evaluate checklist items D7-1 through D7-16.

Return this exact JSON:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences citing specific numbers e.g. rating, above4Pct>",
  "items": [{ "code": "D7-1", "status": "pass"|"fail"|"partial"|"na", "finding": "<cite stat or sample or 'Data unavailable'>", "recommendation": "<action>", "priority": "critical"|"high"|"medium"|"low", "dataSource": "ApifyGoogleReviews"|"GMB"|"Manual", "sourceUrl": null }],
  "criticalFlags": [],
  "strengths": [],
  "quickWins": [],
  "sentimentBreakdown": { "positive": <0-100>, "negative": <0-100>, "neutral": <0-100> },
  "positiveThemes": ["<theme>"],
  "negativeThemes": ["<theme>"],
  "riskFlags": ["<risk>"]
}`;
}

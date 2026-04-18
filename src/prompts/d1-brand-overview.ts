import { buildSharedContext } from './shared';

export function buildD1Prompt(
  developer: { brandName: string; positioning?: string | null; city?: string | null; targetSegments: string[]; websiteUrl?: string | null; yearEstablished?: number | null; legalName?: string | null; promoterName?: string | null },
  pdlData: unknown,
  serpData: unknown,
  auditDate: string
): string {
  const sharedCtx = buildSharedContext(developer.brandName, developer.positioning || '', developer.city || '', developer.targetSegments, developer.websiteUrl, auditDate);
  return `${sharedCtx}

You are auditing the Brand Overview dimension (D1) for ${developer.brandName}.

COMPANY INFORMATION:
- Brand Name: ${developer.brandName}
- Legal Name: ${developer.legalName || 'Not provided'}
- City: ${developer.city || 'Not provided'}
- Year Established: ${developer.yearEstablished || 'Not provided'}
- Positioning: ${developer.positioning || 'Not provided'}
- Promoter: ${developer.promoterName || 'Not provided'}

PDL COMPANY DATA (from People Data Labs):
${JSON.stringify(pdlData, null, 2)}

SERP DATA (brand keyword search):
${JSON.stringify(serpData, null, 2)}

Evaluate the following checklist items for D1 Brand Overview. Use available data for evidence-based assessments. Where data is missing, give "partial" and note what could not be verified — do not assume failure.

Scoring guide for D1: A brand with a clear name, stated positioning, and some market presence should score at least 45. Strong brand identity, consistent messaging, and good SERP presence = 65-80. Score the brand on what it HAS, not what it lacks.

Checklist items to evaluate: D1-1, D1-2, D1-3, D1-4, D1-5, D1-6, D1-7, D1-8, D1-9, D1-10, D1-11, D1-12, D1-13, D1-14, D1-15

Return this JSON structure exactly:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentences specific to this brand's D1 performance>",
  "items": [
    {
      "code": "D1-1",
      "status": "pass" | "fail" | "partial",
      "finding": "<what you found, citing actual data>",
      "recommendation": "<specific action to take>",
      "priority": "critical" | "high" | "medium" | "low",
      "dataSource": "PDL" | "DataForSEO" | "Manual"
    }
  ],
  "criticalFlags": ["<critical issue 1>", ...],
  "strengths": ["<strength 1>", ...],
  "quickWins": ["<quick win 1>", ...]
}`;
}

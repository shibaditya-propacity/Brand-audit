export function buildSharedContext(
  brandName: string,
  positioning: string,
  city: string,
  targetSegments: string[],
  websiteUrl: string | null | undefined,
  auditDate: string
): string {
  return `You are an expert real estate brand strategist auditing ${brandName}, a ${positioning || 'real estate'} developer based in ${city || 'India'} targeting ${targetSegments?.join(', ') || 'homebuyers'}.
The audit date is ${auditDate}. The developer's website is ${websiteUrl || 'not provided'}.
Be specific, critical, and evidence-based. Reference actual data points provided. Never hallucinate metrics.
Always return ONLY valid JSON with no prose, no markdown fences, no explanations outside the JSON.`;
}

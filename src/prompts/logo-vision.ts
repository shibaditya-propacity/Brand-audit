export function buildLogoVisionPrompt(brandName: string, positioning: string): string {
  return `Analyze this logo for a ${positioning || 'real estate'} developer named ${brandName}.

Evaluate:
1. Positioning alignment — does it visually communicate "${positioning}"?
2. Modernity — is it current or dated?
3. Versatility — does it work at small sizes?
4. Color psychology — do colors fit the brand?
5. Typography quality — is the font appropriate?
6. Uniqueness — does it differentiate from generic real estate logos?

Return ONLY this JSON (no prose, no fences):
{
  "overallGrade": "A" | "B" | "C" | "D" | "F",
  "positioningScore": <1-10>,
  "modernityScore": <1-10>,
  "versatilityScore": <1-10>,
  "colorScore": <1-10>,
  "typographyScore": <1-10>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "issues": ["<issue 1>", "<issue 2>"],
  "recommendations": ["<rec 1>", "<rec 2>"]
}`;
}

import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export async function analyzeWithClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt || 'You are an expert real estate brand strategist. Always return valid JSON only, no prose, no markdown fences.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from AI service');

  // Strip markdown fences if present
  let text = content.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return text;
}

export async function analyzeWithVision(
  prompt: string,
  imageUrl: string,
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png'
): Promise<string> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status} ${imageUrl}`);
  const imgBuffer = await imgRes.arrayBuffer();
  const base64Data = Buffer.from(imgBuffer).toString('base64');

  // Detect media type from Content-Type header — overrides the caller's guess
  const contentType = imgRes.headers.get('content-type') ?? '';
  const detectedType = (
    contentType.includes('jpeg') || contentType.includes('jpg') ? 'image/jpeg' :
    contentType.includes('webp') ? 'image/webp' :
    contentType.includes('gif') ? 'image/gif' :
    imageMediaType
  ) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: 'You are an expert brand visual designer. Always return valid JSON only, no prose, no markdown fences.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: detectedType, data: base64Data } },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from AI service');

  let text = content.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return text;
}

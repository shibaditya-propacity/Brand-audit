import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export async function analyzeWithClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt || 'You are an expert real estate brand strategist. Always return valid JSON only, no prose, no markdown fences.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

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
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: 'You are an expert brand visual designer. Always return valid JSON only, no prose, no markdown fences.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  let text = content.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return text;
}

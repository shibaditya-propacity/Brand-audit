/**
 * AI inference wrapper — uses primary service with automatic fallback.
 * Falls back to Claude on any failure so analysis never dies due to a
 * service outage or rate limit.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('AI service configuration error');

  const res = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`AI service error: ${res.status}`);

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  let text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return text;
}

/**
 * Analyze with primary AI, falling back to Claude on any failure.
 */
export async function analyzeWithGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const system = systemPrompt ?? 'You are an expert real estate brand strategist. Always return valid JSON only, no prose, no markdown fences.';
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];

  try {
    return await callGroq(messages, 8192);
  } catch (err) {
    console.warn('[ai] primary service failed, falling back to Claude:', err instanceof Error ? err.message : err);
    const { analyzeWithClaude } = await import('@/lib/anthropic');
    return analyzeWithClaude(prompt, system);
  }
}

export async function extractWithGroq(prompt: string, maxTokens = 256): Promise<string> {
  try {
    return await callGroq([{ role: 'user', content: prompt }], maxTokens);
  } catch (err) {
    console.warn('[ai] extract: primary service failed, falling back to Claude:', err instanceof Error ? err.message : err);
    // For short extractions Claude is fine — use haiku-level budget
    const { analyzeWithClaude } = await import('@/lib/anthropic');
    return analyzeWithClaude(prompt);
  }
}

/**
 * Ask AI to extract a single value from unstructured text.
 * Returns null if nothing useful is found.
 */
export async function extractFieldFromText(
  fieldName: string,
  context: string,
  example?: string,
): Promise<string | null> {
  if (!context.trim()) return null;

  const exampleHint = example ? ` Example format: "${example}".` : '';
  const prompt = `Extract the ${fieldName} from the text below. Return ONLY the value, nothing else. If not found return exactly: null${exampleHint}

Text:
${context.slice(0, 2000)}

${fieldName}:`;

  try {
    const result = await extractWithGroq(prompt, 64);
    if (!result || result.toLowerCase() === 'null' || result.toLowerCase() === 'not found') return null;
    return result.replace(/^["']|["']$/g, '').trim() || null;
  } catch {
    return null;
  }
}

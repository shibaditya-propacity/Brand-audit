/**
 * AI inference wrapper — uses Groq (free) as primary with automatic fallback to Claude.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Robustly extract a JSON object from an LLM response.
 * Handles: markdown fences, preamble text, trailing notes, nested fences.
 */
function extractJson(raw: string): string {
  let text = raw.trim();

  // Strip all markdown code fences (anywhere in the text)
  text = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();

  // If it now starts with { it's clean JSON
  if (text.startsWith('{')) return text;

  // Find the first { and last } to extract the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  // Return as-is and let JSON.parse handle the error with a useful message
  return text;
}

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('AI service configuration error');

  for (let attempt = 0; attempt <= 2; attempt++) {
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

    // Rate limited — wait and retry
    if (res.status === 429) {
      if (attempt < 2) {
        const retryAfter = parseInt(res.headers.get('retry-after') ?? '5', 10);
        console.warn(`[groq] rate limited, retrying in ${retryAfter}s (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error('Groq rate limit exceeded after retries');
    }

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    return extractJson(raw);
  }

  throw new Error('Groq: exhausted retries');
}

/**
 * Analyze with Groq (free), falling back to Claude on any failure.
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
    console.warn('[ai] Groq failed, falling back to Claude:', err instanceof Error ? err.message : err);
    const { analyzeWithClaude } = await import('@/lib/anthropic');
    return analyzeWithClaude(prompt, system);
  }
}

export async function extractWithGroq(prompt: string, maxTokens = 256): Promise<string> {
  try {
    return await callGroq([{ role: 'user', content: prompt }], maxTokens);
  } catch (err) {
    console.warn('[ai] extract: Groq failed, falling back to Claude:', err instanceof Error ? err.message : err);
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

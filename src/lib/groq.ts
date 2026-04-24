/**
 * Groq API wrapper — free tier, fast inference.
 * Used for all dimension analysis and lightweight extraction tasks.
 *
 * Free tier: 14,400 req/day, 500K tokens/min on llama-3.3-70b-versatile
 * Sign up at console.groq.com → create an API key → add GROQ_API_KEY to .env
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Drop-in replacement for analyzeWithClaude — same signature, uses Groq instead.
 * Strips markdown fences from the response just like the Anthropic wrapper.
 */
export async function analyzeWithGroq(prompt: string, systemPrompt?: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set — add it to .env');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  } else {
    messages.push({
      role: 'system',
      content: 'You are an expert real estate brand strategist. Always return valid JSON only, no prose, no markdown fences.',
    });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: 8192,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  let text = data.choices?.[0]?.message?.content?.trim() ?? '';

  // Strip markdown fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return text;
}

export async function extractWithGroq(prompt: string, maxTokens = 256): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set — add it to .env to enable free LLM extraction');
  }

  const res = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

/**
 * Ask Groq to extract a single value from unstructured text.
 * Returns null if Groq says nothing useful is found.
 */
export async function extractFieldFromText(
  fieldName: string,
  context: string,
  example?: string,
): Promise<string | null> {
  if (!GROQ_API_KEY || !context.trim()) return null;

  const exampleHint = example ? ` Example format: "${example}".` : '';
  const prompt = `Extract the ${fieldName} from the text below. Return ONLY the value, nothing else. If not found return exactly: null${exampleHint}

Text:
${context.slice(0, 2000)}

${fieldName}:`;

  try {
    const result = await extractWithGroq(prompt, 64);
    if (!result || result.toLowerCase() === 'null' || result.toLowerCase() === 'not found') return null;
    // Strip surrounding quotes if present
    return result.replace(/^["']|["']$/g, '').trim() || null;
  } catch {
    return null;
  }
}

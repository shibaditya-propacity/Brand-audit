/**
 * AI inference wrapper — uses Claude as the sole provider.
 * All analysis routes call analyzeWithGroq (kept for compatibility) which now routes directly to Claude.
 */

/**
 * Analyze with Claude (primary and only AI provider).
 * The name is kept for backward compatibility with all dimension routes.
 */
export async function analyzeWithGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const { analyzeWithClaude } = await import('@/lib/anthropic');
  return analyzeWithClaude(prompt, systemPrompt);
}

export async function extractWithGroq(prompt: string, _maxTokens = 256): Promise<string> {
  const { analyzeWithClaude } = await import('@/lib/anthropic');
  return analyzeWithClaude(prompt);
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
    const result = await extractWithGroq(prompt);
    if (!result || result.toLowerCase() === 'null' || result.toLowerCase() === 'not found') return null;
    return result.replace(/^["']|["']$/g, '').trim() || null;
  } catch {
    return null;
  }
}

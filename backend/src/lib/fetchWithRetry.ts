/**
 * Fetch wrapper with AbortController timeout and automatic single retry.
 * Use this for all external API calls in src/lib/apis/.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeoutMs = 20000
): Promise<Response> {
  const doFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await doFetch();
    } catch (err) {
      if (attempt < retries) {
        await new Promise<void>(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
  // unreachable but satisfies TS
  throw new Error('fetchWithRetry: exhausted retries');
}

/**
 * Generic retry wrapper for any async function (e.g. axios calls).
 * Retries once after 2 s on any thrown error.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < retries) {
        await new Promise<void>(r => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('withRetry: exhausted retries');
}

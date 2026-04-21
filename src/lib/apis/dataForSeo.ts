import axios from 'axios';
import { withRetry } from '@/lib/fetchWithRetry';

const SERPER_BASE = 'https://google.serper.dev';

const serperClient = axios.create({
  baseURL: SERPER_BASE,
  timeout: 15000,
  headers: {
    'X-API-KEY': process.env.SERPER_API_KEY,
    'Content-Type': 'application/json',
  },
});

export async function getSerpResults(keyword: string) {
  const response = await withRetry(() =>
    serperClient.post('/search', { q: keyword, gl: 'in', hl: 'en', num: 10 })
  );
  return response.data || null;
}

// No Serper equivalent — returns null
export async function getBacklinksSummary(_domain: string) {
  return null;
}

// No Serper equivalent — returns null
export async function postOnPageTask(_domain: string): Promise<string | null> {
  return null;
}

// No Serper equivalent — returns null
export async function getOnPageResults(_taskId: string) {
  return null;
}

// No Serper equivalent — returns null
export async function postGoogleReviewsTask(_brandName: string): Promise<string | null> {
  return null;
}

// No Serper equivalent — returns null
export async function getGoogleReviewsResults(_taskId: string) {
  return null;
}

export function findDomainInSerp(serpResult: { organic?: Array<{ link: string; position: number }> }, domain: string) {
  if (!serpResult?.organic) return null;
  const normalizedDomain = domain.replace(/^www\./, '');
  const found = serpResult.organic.find((item) => {
    try { return new URL(item.link).hostname.replace(/^www\./, '').includes(normalizedDomain); }
    catch { return false; }
  });
  return found ? { ...found } : null;
}

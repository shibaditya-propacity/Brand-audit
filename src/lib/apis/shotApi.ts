import axios from 'axios';
import { withRetry } from '@/lib/fetchWithRetry';

export async function captureScreenshot(websiteUrl: string): Promise<string | null> {
  try {
    const response = await withRetry(() =>
      axios.get('https://api.microlink.io/', {
        timeout: 30000,
        params: { url: websiteUrl, screenshot: true, meta: false },
      })
    );
    const url: string | undefined = response.data?.data?.screenshot?.url;
    return url || null;
  } catch {
    return null;
  }
}

export function getClearbitLogoUrl(domain: string): string {
  const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return `https://logo.clearbit.com/${clean}`;
}

export async function checkClearbitLogo(domain: string): Promise<string | null> {
  const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  // Try Clearbit first, fall back to Google favicon
  try {
    const logoUrl = `https://logo.clearbit.com/${clean}`;
    const res = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 8000 });
    if (res.status === 200 && (res.headers['content-type'] || '').startsWith('image/')) return logoUrl;
  } catch { /* fall through */ }
  // Google high-res favicon as fallback (always works)
  return `https://www.google.com/s2/favicons?sz=128&domain=${clean}`;
}

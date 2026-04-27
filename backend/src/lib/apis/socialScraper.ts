import { fetchWithRetry } from '@/lib/fetchWithRetry';

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?/,
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)\/?/,
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)\/?/,
  youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)?([a-zA-Z0-9_.-]+)\/?/,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?/,
  whatsapp: /(?:https?:\/\/)?(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/)([0-9]+)/,
};

export interface SocialLinks {
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  youtube: string | null;
  twitter: string | null;
  whatsapp: string | null;
}

function extractFromUrl(url: string): Partial<SocialLinks> {
  const result: Partial<SocialLinks> = {};
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    if (pattern.test(url)) {
      result[platform as keyof SocialLinks] = url;
    }
  }
  return result;
}

function mergeLinks(base: SocialLinks, incoming: Partial<SocialLinks>): SocialLinks {
  return {
    instagram: base.instagram ?? incoming.instagram ?? null,
    linkedin: base.linkedin ?? incoming.linkedin ?? null,
    facebook: base.facebook ?? incoming.facebook ?? null,
    youtube: base.youtube ?? incoming.youtube ?? null,
    twitter: base.twitter ?? incoming.twitter ?? null,
    whatsapp: base.whatsapp ?? incoming.whatsapp ?? null,
  };
}

export async function scrapeSocialLinks(websiteUrl: string): Promise<SocialLinks> {
  const links: SocialLinks = {
    instagram: null, linkedin: null, facebook: null,
    youtube: null, twitter: null, whatsapp: null,
  };

  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandAuditBot/1.0)' },
    }, 1, 12000);

    if (!res.ok) return links;
    const html = await res.text();

    // 1. Parse JSON-LD sameAs
    const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jMatch: RegExpExecArray | null;
    while ((jMatch = jsonLdRe.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(jMatch[1]);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        for (const entry of entries) {
          const sameAs: string[] = Array.isArray(entry?.sameAs) ? entry.sameAs : (entry?.sameAs ? [entry.sameAs] : []);
          for (const sa of sameAs) {
            Object.assign(links, mergeLinks(links, extractFromUrl(sa)));
          }
        }
      } catch { /* ignore malformed JSON-LD */ }
    }

    // 2. Fallback: scan <a href> tags
    const hrefRe = /href=["']([^"']+)["']/gi;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = hrefRe.exec(html)) !== null) {
      const href = hMatch[1];
      if (!href.startsWith('http')) continue;
      if (/instagram\.com|linkedin\.com|facebook\.com|youtube\.com|twitter\.com|x\.com|wa\.me|whatsapp\.com/.test(href)) {
        Object.assign(links, mergeLinks(links, extractFromUrl(href)));
      }
    }

  } catch (err) {
    console.error('[socialScraper] error:', err instanceof Error ? err.message : err);
  }

  return links;
}

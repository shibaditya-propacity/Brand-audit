/**
 * Serper-based social media insights.
 * Uses Google search results to extract public profile data from Instagram,
 * Facebook, and LinkedIn — no separate API keys or scrapers needed.
 */

import { getSerpResults } from './dataForSeo';

// ── Number parser ──────────────────────────────────────────────────────────────
function parseCount(raw: string): number | null {
  if (!raw) return null;
  // Remove commas, spaces; handle K/M/B suffixes
  const cleaned = raw.replace(/,/g, '').replace(/\s/g, '').trim();
  const m = cleaned.match(/^([\d.]+)\s*([KkMmBb]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const suffix = m[2].toLowerCase();
  if (suffix === 'k') return Math.round(n * 1_000);
  if (suffix === 'm') return Math.round(n * 1_000_000);
  if (suffix === 'b') return Math.round(n * 1_000_000_000);
  return Math.round(n);
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m) return null;
  return parseCount(m[1]);
}

// ── Instagram ──────────────────────────────────────────────────────────────────
export interface InstagramInsights {
  handle: string;
  profileUrl: string | null;
  followers: number | null;
  following: number | null;
  totalPosts: number | null;
  bio: string | null;
  recentPostSummaries: string[];
  source: 'Serper';
}

export async function getInstagramInsights(
  handle: string,
  brandName: string
): Promise<InstagramInsights> {
  const result: InstagramInsights = {
    handle,
    profileUrl: `https://www.instagram.com/${handle}/`,
    followers: null,
    following: null,
    totalPosts: null,
    bio: null,
    recentPostSummaries: [],
    source: 'Serper',
  };

  try {
    // Three searches in parallel:
    // 1. Direct profile page (gets post count, following, sometimes followers)
    // 2. Brand + instagram (knowledge graph follower count)
    // 3. SocialBlade (reliably shows follower count in snippet)
    const [profileResult, brandResult, socialBladeResult] = await Promise.all([
      getSerpResults(`site:instagram.com/${handle}`).catch(() => null),
      getSerpResults(`"${brandName}" instagram followers`).catch(() => null),
      getSerpResults(`site:socialblade.com instagram user/${handle}`).catch(() => null),
    ]);

    // ── Extract from profile page organic result ───────────────────────────
    const organic: Array<{ title?: string; snippet?: string; link?: string }> =
      (profileResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? [];

    for (const item of organic) {
      const snippet = item.snippet ?? '';
      const title = item.title ?? '';
      const text = `${title} ${snippet}`;

      // "12.5K Followers, 234 Following, 156 Posts"
      if (!result.followers) result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*Followers?/i);
      if (!result.following) result.following = extractNumber(text, /([\d.,]+[KkMm]?)\s*Following/i);
      if (!result.totalPosts) result.totalPosts = extractNumber(text, /([\d.,]+[KkMm]?)\s*Posts?/i);

      // Bio is usually in the snippet after the stats
      if (!result.bio && snippet.length > 20) {
        // Remove the "X Followers, Y Following, Z Posts - " prefix if present
        const bioText = snippet.replace(/[\d.,]+[KkMm]?\s*Followers?,\s*[\d.,]+[KkMm]?\s*Following,\s*[\d.,]+[KkMm]?\s*Posts?\s*[-–]\s*/i, '').trim();
        if (bioText.length > 10) result.bio = bioText.slice(0, 200);
      }
    }

    // Collect recent post titles/snippets (from organic results)
    const postResults = organic.filter(r => r.link?.includes('/p/'));
    result.recentPostSummaries = postResults.slice(0, 6).map(r => r.snippet ?? r.title ?? '').filter(Boolean);

    // ── Extract from knowledge graph ───────────────────────────────────────
    const kg = (brandResult as { knowledgeGraph?: { description?: string; attributes?: Record<string, string> } })?.knowledgeGraph;
    if (kg) {
      if (!result.followers && kg.attributes) {
        const raw = kg.attributes['Followers'] ?? kg.attributes['Instagram followers'] ?? '';
        if (raw) result.followers = parseCount(raw);
      }
      if (!result.bio && kg.description) result.bio = kg.description.slice(0, 200);
    }

    // ── Try organic from brand search too ─────────────────────────────────
    const brandOrganic: Array<{ title?: string; snippet?: string; link?: string }> =
      (brandResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? [];

    for (const item of brandOrganic) {
      if (!item.link?.includes('instagram.com')) continue;
      const text = `${item.title ?? ''} ${item.snippet ?? ''}`;
      if (!result.followers) result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*Followers?/i);
      if (!result.following) result.following = extractNumber(text, /([\d.,]+[KkMm]?)\s*Following/i);
      if (!result.totalPosts) result.totalPosts = extractNumber(text, /([\d.,]+[KkMm]?)\s*Posts?/i);
    }

    // ── SocialBlade fallback for followers ────────────────────────────────
    // SocialBlade snippets: "X Followers | Y Media Uploads | Z Following"
    if (!result.followers) {
      const sbOrganic: Array<{ title?: string; snippet?: string }> =
        (socialBladeResult as { organic?: Array<{ title?: string; snippet?: string }> })?.organic ?? [];
      for (const item of sbOrganic) {
        const text = `${item.title ?? ''} ${item.snippet ?? ''}`;
        const f = extractNumber(text, /([\d.,]+[KkMm]?)\s*Followers?/i);
        if (f) { result.followers = f; break; }
        // SocialBlade format: "12.5K | Followers"
        const f2 = extractNumber(text, /([\d.,]+[KkMm]?)\s*\|\s*Followers?/i);
        if (f2) { result.followers = f2; break; }
      }
    }

  } catch (err) {
    console.error('[socialInsights] Instagram error:', err instanceof Error ? err.message : err);
  }

  return result;
}

// ── Facebook ───────────────────────────────────────────────────────────────────
export interface FacebookInsights {
  pageUrl: string;
  pageName: string | null;
  likes: number | null;
  followers: number | null;
  talkingAbout: number | null;
  description: string | null;
  source: 'Serper';
}

export async function getFacebookInsights(
  facebookUrl: string,
  brandName: string
): Promise<FacebookInsights> {
  // Normalise URL
  const pageUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://www.facebook.com/${facebookUrl}`;
  const result: FacebookInsights = {
    pageUrl,
    pageName: null,
    likes: null,
    followers: null,
    talkingAbout: null,
    description: null,
    source: 'Serper',
  };

  try {
    const [pageResult, brandResult] = await Promise.all([
      getSerpResults(`site:facebook.com "${brandName}"`).catch(() => null),
      getSerpResults(`"${brandName}" facebook page likes followers`).catch(() => null),
    ]);

    const allOrganic: Array<{ title?: string; snippet?: string; link?: string }> = [
      ...((pageResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? []),
      ...((brandResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? []),
    ];

    for (const item of allOrganic) {
      if (!item.link?.includes('facebook.com')) continue;
      const text = `${item.title ?? ''} ${item.snippet ?? ''}`;

      // "8,234 likes · 1,234 talking about this"
      // "8.2K likes · 1.2K followers"
      if (!result.likes) result.likes = extractNumber(text, /([\d.,]+[KkMm]?)\s*likes?/i);
      if (!result.followers) result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*followers?/i);
      if (!result.talkingAbout) result.talkingAbout = extractNumber(text, /([\d.,]+[KkMm]?)\s*talking about this/i);
      if (!result.pageName && item.title) result.pageName = item.title.replace(/ [-|] Facebook.*$/i, '').trim();

      const snippet = item.snippet ?? '';
      if (!result.description && snippet.length > 20 && !snippet.match(/^\d/)) {
        result.description = snippet.slice(0, 200);
      }
    }

    // Knowledge graph fallback
    const kg = (brandResult as { knowledgeGraph?: { description?: string; attributes?: Record<string, string> } })?.knowledgeGraph;
    if (kg) {
      if (!result.description && kg.description) result.description = kg.description.slice(0, 200);
      if (kg.attributes) {
        if (!result.likes) result.likes = parseCount(kg.attributes['Likes'] ?? kg.attributes['Facebook likes'] ?? '');
        if (!result.followers) result.followers = parseCount(kg.attributes['Followers'] ?? kg.attributes['Facebook followers'] ?? '');
      }
    }

  } catch (err) {
    console.error('[socialInsights] Facebook error:', err instanceof Error ? err.message : err);
  }

  return result;
}

// ── LinkedIn ───────────────────────────────────────────────────────────────────
export interface LinkedInInsights {
  pageUrl: string;
  companyName: string | null;
  followers: number | null;
  employees: number | null;
  industry: string | null;
  description: string | null;
  source: 'Serper';
}

export async function getLinkedInInsights(
  linkedinUrl: string,
  brandName: string
): Promise<LinkedInInsights> {
  const pageUrl = linkedinUrl.startsWith('http') ? linkedinUrl : `https://www.linkedin.com/company/${linkedinUrl}`;
  const result: LinkedInInsights = {
    pageUrl,
    companyName: null,
    followers: null,
    employees: null,
    industry: null,
    description: null,
    source: 'Serper',
  };

  try {
    const [pageResult, brandResult] = await Promise.all([
      getSerpResults(`site:linkedin.com/company "${brandName}"`).catch(() => null),
      getSerpResults(`"${brandName}" linkedin company followers employees`).catch(() => null),
    ]);

    const allOrganic: Array<{ title?: string; snippet?: string; link?: string }> = [
      ...((pageResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? []),
      ...((brandResult as { organic?: Array<{ title?: string; snippet?: string; link?: string }> })?.organic ?? []),
    ];

    for (const item of allOrganic) {
      if (!item.link?.includes('linkedin.com')) continue;
      const text = `${item.title ?? ''} ${item.snippet ?? ''}`;

      // "5,432 followers on LinkedIn"
      // "Propacity | 5.4K followers on LinkedIn"
      if (!result.followers) result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*followers?\s*on LinkedIn/i);
      if (!result.followers) result.followers = extractNumber(text, /LinkedIn[^|]*\|\s*([\d.,]+[KkMm]?)\s*followers?/i);
      if (!result.followers) result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*followers?/i);

      // "501-1,000 employees" or "10,000+ employees"
      if (!result.employees) {
        const empMatch = text.match(/([\d,]+)\s*[-–]\s*([\d,]+)\s*employees?/i)
          ?? text.match(/([\d,]+)\+?\s*employees?/i);
        if (empMatch) {
          // For ranges take the lower bound; for "+" take as-is
          result.employees = parseCount(empMatch[1].replace(/,/g, ''));
        }
      }

      if (!result.companyName && item.title) {
        result.companyName = item.title.replace(/\s*\|.*$/, '').replace(/\s*[-–].*LinkedIn.*$/i, '').trim();
      }

      const snippet = item.snippet ?? '';
      if (!result.description && snippet.length > 20) {
        result.description = snippet.slice(0, 200);
      }

      // Industry — often in snippet: "Real estate · 501-1,000 employees"
      if (!result.industry) {
        const indMatch = snippet.match(/^([^·\n]{5,40})\s*·/);
        if (indMatch) result.industry = indMatch[1].trim();
      }
    }

    // Knowledge graph fallback
    const kg = (brandResult as { knowledgeGraph?: { description?: string; type?: string; attributes?: Record<string, string> } })?.knowledgeGraph;
    if (kg) {
      if (!result.description && kg.description) result.description = kg.description.slice(0, 200);
      if (!result.industry && kg.type) result.industry = kg.type;
      if (kg.attributes) {
        if (!result.followers) result.followers = parseCount(kg.attributes['LinkedIn followers'] ?? kg.attributes['Followers'] ?? '');
        if (!result.employees) result.employees = parseCount((kg.attributes['Employees'] ?? '').replace(/[^0-9]/g, ''));
      }
    }

  } catch (err) {
    console.error('[socialInsights] LinkedIn error:', err instanceof Error ? err.message : err);
  }

  return result;
}

// ── Combined entry point ───────────────────────────────────────────────────────
export interface SocialInsightsResult {
  instagram: InstagramInsights | null;
  facebook: FacebookInsights | null;
  linkedin: LinkedInInsights | null;
}

export async function getSocialInsights(dev: {
  brandName: string;
  instagramHandle?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
}): Promise<SocialInsightsResult> {
  const [instagram, facebook, linkedin] = await Promise.all([
    dev.instagramHandle
      ? getInstagramInsights(dev.instagramHandle.replace('@', ''), dev.brandName).catch(() => null)
      : Promise.resolve(null),
    dev.facebookUrl
      ? getFacebookInsights(dev.facebookUrl, dev.brandName).catch(() => null)
      : Promise.resolve(null),
    dev.linkedinUrl
      ? getLinkedInInsights(dev.linkedinUrl, dev.brandName).catch(() => null)
      : Promise.resolve(null),
  ]);

  return { instagram, facebook, linkedin };
}

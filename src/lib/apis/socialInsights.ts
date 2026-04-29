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

// ── Promoter Personal LinkedIn ────────────────────────────────────────────────
export interface PromoterLinkedInInsights {
  profileUrl: string;
  fullName: string | null;
  headline: string | null;
  followers: number | null;
  connections: string | null; // "500+", "1K+", etc.
  about: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  source: 'Serper';
}

export async function getPromoterLinkedInInsights(
  linkedinUrl: string,
  promoterName: string | null
): Promise<PromoterLinkedInInsights> {
  const profileUrl = linkedinUrl.startsWith('http') ? linkedinUrl : `https://www.linkedin.com/in/${linkedinUrl}`;
  const result: PromoterLinkedInInsights = {
    profileUrl,
    fullName: null,
    headline: null,
    followers: null,
    connections: null,
    about: null,
    currentRole: null,
    currentCompany: null,
    source: 'Serper',
  };

  try {
    // Extract the handle from the URL for a direct site search
    const handle = profileUrl.replace(/\/$/, '').split('/').pop() ?? '';

    const queries = [
      `site:linkedin.com/in/${handle}`,
      promoterName ? `"${promoterName}" linkedin real estate developer` : null,
      `linkedin.com/in/${handle} followers connections`,
    ].filter(Boolean) as string[];

    const results = await Promise.all(
      queries.map(q => getSerpResults(q).catch(() => null))
    );

    const allOrganic: Array<{ title?: string; snippet?: string; link?: string }> = results.flatMap(r =>
      (r as { organic?: Array<{ title?: string; snippet?: string; link?: string }> } | null)?.organic ?? []
    );

    for (const item of allOrganic) {
      const isProfile = item.link?.includes('linkedin.com/in/');
      const text = `${item.title ?? ''} ${item.snippet ?? ''}`;

      // Full name — usually the first part of the LinkedIn page title
      if (!result.fullName && item.title) {
        const nameMatch = item.title.match(/^([^|–-]+?)(?:\s*[-–|]|\s+on LinkedIn)/i);
        if (nameMatch) result.fullName = nameMatch[1].trim();
      }

      // Headline — "Title at Company" pattern after name in title
      if (!result.headline && item.title) {
        const hlMatch = item.title.match(/[-–|]\s*(.+?)(?:\s*[-–|]\s*LinkedIn|$)/i);
        if (hlMatch) result.headline = hlMatch[1].trim();
      }

      // Followers — "12,500 followers" or "12.5K followers"
      if (!result.followers && isProfile) {
        result.followers = extractNumber(text, /([\d.,]+[KkMm]?)\s*followers?/i);
      }

      // Connections — "500+ connections"
      if (!result.connections) {
        const connMatch = text.match(/([\d,]+\+?)\s*connections?/i);
        if (connMatch) result.connections = connMatch[1];
      }

      // About / bio — from the snippet when it's not just stats
      if (!result.about && item.snippet && item.snippet.length > 30 && isProfile) {
        result.about = item.snippet.slice(0, 300);
      }

      // Current role + company — "Director at Propacity" style
      if (!result.currentRole) {
        const roleMatch = text.match(/\b([A-Z][^.!?]+?)\s+at\s+([A-Z][^.!?]+?)(?:\s*[·|]|$)/);
        if (roleMatch) {
          result.currentRole = roleMatch[1].trim();
          if (!result.currentCompany) result.currentCompany = roleMatch[2].trim();
        }
      }
    }

    // Knowledge graph fallback
    for (const r of results) {
      const kg = (r as { knowledgeGraph?: { description?: string; title?: string; type?: string; attributes?: Record<string, string> } } | null)?.knowledgeGraph;
      if (!kg) continue;
      if (!result.fullName && kg.title) result.fullName = kg.title;
      if (!result.headline && kg.type) result.headline = kg.type;
      if (!result.about && kg.description) result.about = kg.description.slice(0, 300);
      if (kg.attributes) {
        if (!result.followers) result.followers = parseCount(kg.attributes['Followers'] ?? '');
      }
    }
  } catch (err) {
    console.error('[socialInsights] PromoterLinkedIn error:', err instanceof Error ? err.message : err);
  }

  return result;
}

// ── YouTube ────────────────────────────────────────────────────────────────────
export interface YouTubeInsights {
  channelUrl: string;
  channelName: string | null;
  description: string | null;
  subscribers: number | null;
  totalVideos: number | null;
  totalViews: number | null;
  avgViewsPerVideo: number | null;
  uploadFrequencyPerMonth: number | null;
  recentVideos: Array<{ title: string; publishedAt: string; viewCount: number | null }>;
  source: 'YouTubeDataAPI';
}

function extractYouTubeHandle(url: string): string | null {
  // Supports: @handle, /c/name, /channel/UCxxx, /user/name
  const m = url.match(/youtube\.com\/(?:@([a-zA-Z0-9_.-]+)|c\/([a-zA-Z0-9_.-]+)|channel\/(UC[a-zA-Z0-9_-]+)|user\/([a-zA-Z0-9_.-]+))/);
  if (!m) return null;
  return m[1] || m[2] || m[3] || m[4] || null;
}

export async function getYouTubeInsights(
  channelUrl: string,
  _brandName: string
): Promise<YouTubeInsights> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  const result: YouTubeInsights = {
    channelUrl,
    channelName: null,
    description: null,
    subscribers: null,
    totalVideos: null,
    totalViews: null,
    avgViewsPerVideo: null,
    uploadFrequencyPerMonth: null,
    recentVideos: [],
    source: 'YouTubeDataAPI',
  };

  if (!apiKey) {
    console.warn('[YouTube] YOUTUBE_DATA_API_KEY not set');
    return result;
  }

  try {
    const handle = extractYouTubeHandle(channelUrl);
    if (!handle) {
      console.warn('[YouTube] Could not extract handle from URL:', channelUrl);
      return result;
    }

    // Step 1: Get channel info
    const isChannelId = handle.startsWith('UC');
    const channelParam = isChannelId
      ? `id=${handle}`
      : handle.startsWith('UC') ? `id=${handle}` : `forHandle=@${handle.replace(/^@/, '')}`;

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&${channelParam}&key=${apiKey}`
    );
    const channelJson = await channelRes.json() as {
      items?: Array<{
        id: string;
        snippet: { title: string; description: string };
        statistics: { subscriberCount: string; videoCount: string; viewCount: string };
      }>;
    };

    const channel = channelJson.items?.[0];
    if (!channel) {
      console.warn('[YouTube] No channel found for:', handle);
      return result;
    }

    const channelId = channel.id;
    result.channelName = channel.snippet?.title ?? null;
    result.description = channel.snippet?.description?.slice(0, 300) ?? null;
    result.subscribers = parseInt(channel.statistics?.subscriberCount ?? '0', 10) || null;
    result.totalVideos = parseInt(channel.statistics?.videoCount ?? '0', 10) || null;
    result.totalViews = parseInt(channel.statistics?.viewCount ?? '0', 10) || null;

    if (result.totalVideos && result.totalVideos > 0 && result.totalViews) {
      result.avgViewsPerVideo = Math.round(result.totalViews / result.totalVideos);
    }

    // Step 2: Get recent videos (last 10)
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    );
    const searchJson = await searchRes.json() as {
      items?: Array<{ id: { videoId: string }; snippet: { title: string; publishedAt: string } }>;
    };

    const videos = searchJson.items ?? [];

    // Step 3: Get video statistics for view counts
    const videoIds = videos.map(v => v.id.videoId).filter(Boolean).join(',');
    let videoStats: Record<string, number> = {};

    if (videoIds) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
      );
      const statsJson = await statsRes.json() as {
        items?: Array<{ id: string; statistics: { viewCount: string } }>;
      };
      for (const v of statsJson.items ?? []) {
        videoStats[v.id] = parseInt(v.statistics?.viewCount ?? '0', 10);
      }
    }

    result.recentVideos = videos.slice(0, 6).map(v => ({
      title: v.snippet?.title ?? '',
      publishedAt: v.snippet?.publishedAt ?? '',
      viewCount: videoStats[v.id.videoId] ?? null,
    }));

    // Calculate upload frequency: videos per month based on last 10 videos
    if (result.recentVideos.length >= 2) {
      const dates = result.recentVideos
        .map(v => new Date(v.publishedAt).getTime())
        .filter(d => !isNaN(d))
        .sort((a, b) => b - a);
      if (dates.length >= 2) {
        const spanMs = dates[0] - dates[dates.length - 1];
        const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30);
        if (spanMonths > 0) {
          result.uploadFrequencyPerMonth = Math.round((dates.length / spanMonths) * 10) / 10;
        }
      }
    }

  } catch (err) {
    console.error('[socialInsights] YouTube error:', err instanceof Error ? err.message : err);
  }

  return result;
}

// ── Combined entry point ───────────────────────────────────────────────────────
export interface SocialInsightsResult {
  instagram: InstagramInsights | null;
  facebook: FacebookInsights | null;
  linkedin: LinkedInInsights | null;
  youtube: YouTubeInsights | null;
}

export async function getSocialInsights(dev: {
  brandName: string;
  instagramHandle?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
}): Promise<SocialInsightsResult> {
  const [instagram, facebook, linkedin, youtube] = await Promise.all([
    dev.instagramHandle
      ? getInstagramInsights(dev.instagramHandle.replace('@', ''), dev.brandName).catch(() => null)
      : Promise.resolve(null),
    dev.facebookUrl
      ? getFacebookInsights(dev.facebookUrl, dev.brandName).catch(() => null)
      : Promise.resolve(null),
    dev.linkedinUrl
      ? getLinkedInInsights(dev.linkedinUrl, dev.brandName).catch(() => null)
      : Promise.resolve(null),
    dev.youtubeUrl
      ? getYouTubeInsights(dev.youtubeUrl, dev.brandName).catch(() => null)
      : Promise.resolve(null),
  ]);

  return { instagram, facebook, linkedin, youtube };
}

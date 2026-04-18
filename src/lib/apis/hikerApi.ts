import axios from 'axios';
import type { ApifyInstagramProfile, ApifyInstagramPost } from '@/types/apiResponses';

const APIFY_URL = 'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items';

async function apifyRun<T>(input: Record<string, unknown>): Promise<T[]> {
  const response = await axios.post<T[]>(APIFY_URL, input, {
    params: { token: process.env.APIFY_API_KEY },
    headers: { 'Content-Type': 'application/json' },
  });
  const data = response.data || [];
  // Filter out Apify error objects (e.g. { error: 'no_items', errorDescription: '...' })
  return data.filter((item) => !(item as Record<string, unknown>).error);
}

export async function getUserByUsername(username: string): Promise<ApifyInstagramProfile | null> {
  try {
    const [profile] = await apifyRun<ApifyInstagramProfile>({
      usernames: [username],
      resultsLimit: 1,
      resultsType: 'details',
    });
    // store username as pk so getUserPosts can reuse it
    return profile ? { ...profile, pk: profile.username } : null;
  } catch {
    return null;
  }
}

export async function getUserPosts(username: string, amount = 12): Promise<ApifyInstagramPost[]> {
  try {
    return await apifyRun<ApifyInstagramPost>({
      usernames: [username],
      resultsLimit: amount,
      resultsType: 'posts',
    });
  } catch {
    return [];
  }
}

export function calculateInstagramMetrics(user: ApifyInstagramProfile, posts: ApifyInstagramPost[]) {
  const followers = user.followersCount || 0;
  const avgLikes = posts.length ? posts.reduce((s, p) => s + (p.likesCount || 0), 0) / posts.length : 0;
  const avgComments = posts.length ? posts.reduce((s, p) => s + (p.commentsCount || 0), 0) / posts.length : 0;
  const engagementRate = followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0;

  const contentMix = {
    photos: posts.filter(p => p.type === 'Image').length,
    videos: posts.filter(p => p.type === 'Video').length,
    carousels: posts.filter(p => p.type === 'Sidecar').length,
  };

  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastPostDate = sortedPosts[0]?.timestamp ?? null;

  let postsPerWeek = 0;
  if (sortedPosts.length >= 2) {
    const firstTs = new Date(sortedPosts[sortedPosts.length - 1].timestamp).getTime();
    const lastTs = new Date(sortedPosts[0].timestamp).getTime();
    const weeksDiff = (lastTs - firstTs) / (7 * 24 * 3600 * 1000);
    postsPerWeek = weeksDiff > 0 ? sortedPosts.length / weeksDiff : 0;
  }

  return {
    followers,
    following: user.followingCount,
    totalPosts: user.postsCount,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    engagementRate: Math.round(engagementRate * 100) / 100,
    contentMix,
    postsPerWeek: Math.round(postsPerWeek * 10) / 10,
    lastPostDate,
    isBusinessAccount: user.isBusinessAccount,
  };
}

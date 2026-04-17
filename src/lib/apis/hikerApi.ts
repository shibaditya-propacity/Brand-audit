import axios from 'axios';
import type { HikerUserResponse, HikerPostResponse } from '@/types/apiResponses';

const HIKER_BASE = 'https://hikerapi.com/api/v1';

const hikerClient = axios.create({
  baseURL: HIKER_BASE,
  headers: { 'x-access-key': process.env.HIKER_API_KEY },
});

export async function getUserByUsername(username: string): Promise<HikerUserResponse | null> {
  try {
    const response = await hikerClient.get('/user/by/username', {
      params: { username },
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function getUserPosts(userId: string, amount = 12): Promise<HikerPostResponse[]> {
  try {
    const response = await hikerClient.get('/user/medias', {
      params: { user_id: userId, amount },
    });
    return response.data?.items || response.data || [];
  } catch {
    return [];
  }
}

export function calculateInstagramMetrics(user: HikerUserResponse, posts: HikerPostResponse[]) {
  const followers = user.follower_count || 0;
  const avgLikes = posts.length ? posts.reduce((s, p) => s + (p.like_count || 0), 0) / posts.length : 0;
  const avgComments = posts.length ? posts.reduce((s, p) => s + (p.comment_count || 0), 0) / posts.length : 0;
  const engagementRate = followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0;

  const contentMix = {
    photos: posts.filter(p => p.media_type === 1).length,
    videos: posts.filter(p => p.media_type === 2).length,
    carousels: posts.filter(p => p.media_type === 8).length,
  };

  const sortedPosts = [...posts].sort((a, b) => b.taken_at - a.taken_at);
  const lastPostDate = sortedPosts[0] ? new Date(sortedPosts[0].taken_at * 1000) : null;

  let postsPerWeek = 0;
  if (sortedPosts.length >= 2) {
    const firstTs = sortedPosts[sortedPosts.length - 1].taken_at;
    const lastTs = sortedPosts[0].taken_at;
    const weeksDiff = (lastTs - firstTs) / (7 * 24 * 3600);
    postsPerWeek = weeksDiff > 0 ? sortedPosts.length / weeksDiff : 0;
  }

  return {
    followers,
    following: user.following_count,
    totalPosts: user.media_count,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    engagementRate: Math.round(engagementRate * 100) / 100,
    contentMix,
    postsPerWeek: Math.round(postsPerWeek * 10) / 10,
    lastPostDate: lastPostDate?.toISOString(),
    isBusinessAccount: user.is_business_account,
  };
}

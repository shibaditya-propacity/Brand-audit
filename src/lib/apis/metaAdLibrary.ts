import axios from 'axios';
import { withRetry } from '@/lib/fetchWithRetry';
import type { MetaAdResponse } from '@/types/apiResponses';

const APIFY_URL = 'https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items';

export async function getMetaAds(brandName: string): Promise<MetaAdResponse[]> {
  try {
    const response = await withRetry(() =>
      axios.post<MetaAdResponse[]>(
        APIFY_URL,
        { searchTerms: [brandName], country: 'IN', resultsLimit: 25 },
        {
          timeout: 15000,
          params: { token: process.env.APIFY_API_KEY },
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    return response.data || [];
  } catch {
    return [];
  }
}

export function analyzeMetaAds(ads: MetaAdResponse[]) {
  if (!ads.length) return { totalAds: 0, isActive: false, lastAdDate: null, spendRange: null, adCopySamples: [] };

  const sortedAds = [...ads].sort((a, b) => {
    const dateA = a.ad_creation_time ? new Date(a.ad_creation_time).getTime() : 0;
    const dateB = b.ad_creation_time ? new Date(b.ad_creation_time).getTime() : 0;
    return dateB - dateA;
  });

  const lastAdDate = sortedAds[0].ad_creation_time;
  const daysSinceLastAd = lastAdDate
    ? Math.floor((Date.now() - new Date(lastAdDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const spendRanges = ads.filter(a => a.spend?.lower_bound).map(a => ({
    min: parseInt(a.spend?.lower_bound || '0'),
    max: parseInt(a.spend?.upper_bound || '0'),
  }));

  const adCopySamples = ads
    .filter(a => a.ad_creative_bodies?.length)
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      copy: a.ad_creative_bodies?.[0]?.substring(0, 200),
      title: a.ad_creative_link_titles?.[0],
      date: a.ad_creation_time,
      pageName: a.page_name,
      snapshotUrl: a.ad_snapshot_url,
    }));

  return {
    totalAds: ads.length,
    isActive: daysSinceLastAd !== null && daysSinceLastAd <= 30,
    lastAdDate,
    daysSinceLastAd,
    spendRange: spendRanges.length ? {
      minMin: Math.min(...spendRanges.map(s => s.min)),
      maxMax: Math.max(...spendRanges.map(s => s.max)),
      currency: ads[0].currency || 'INR',
    } : null,
    adCopySamples,
  };
}

import axios from 'axios';

const DFS_BASE = 'https://api.dataforseo.com/v3';

function getAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

const dfsClient = axios.create({
  baseURL: DFS_BASE,
  headers: {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  },
});

export async function getSerpResults(keyword: string) {
  const response = await dfsClient.post('/serp/google/organic/live/advanced', [
    { keyword, location_code: 2356, language_code: 'en', device: 'desktop', depth: 10 },
  ]);
  return response.data?.tasks?.[0]?.result?.[0] || null;
}

export async function getBacklinksSummary(domain: string) {
  const response = await dfsClient.post('/backlinks/summary/live', [
    { target: domain, limit: 1 },
  ]);
  return response.data?.tasks?.[0]?.result?.[0] || null;
}

export async function postOnPageTask(domain: string): Promise<string | null> {
  const response = await dfsClient.post('/on_page/task_post', [
    { target: domain, max_crawl_pages: 50, load_resources: true, enable_javascript: true },
  ]);
  return response.data?.tasks?.[0]?.id || null;
}

export async function getOnPageResults(taskId: string) {
  const response = await dfsClient.get(`/on_page/summary/${taskId}`);
  return response.data?.tasks?.[0]?.result?.[0] || null;
}

export async function postGoogleReviewsTask(brandName: string): Promise<string | null> {
  const response = await dfsClient.post('/business_data/google/reviews/task_post', [
    { keyword: brandName, location_code: 2356, language_code: 'en', depth: 10 },
  ]);
  return response.data?.tasks?.[0]?.id || null;
}

export async function getGoogleReviewsResults(taskId: string) {
  const response = await dfsClient.get(`/business_data/google/reviews/task_get/${taskId}`);
  return response.data?.tasks?.[0]?.result?.[0] || null;
}

export function findDomainInSerp(serpResult: { items?: Array<{ domain: string; rank_absolute: number }> }, domain: string) {
  if (!serpResult?.items) return null;
  const normalizedDomain = domain.replace(/^www\./, '');
  const found = serpResult.items.find((item) =>
    item.domain?.includes(normalizedDomain)
  );
  return found ? { position: found.rank_absolute, ...found } : null;
}

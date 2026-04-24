/**
 * MetAPI – Meta Ad Library
 * Flow: POST /v1/tasks → poll GET /v1/tasks/:id/status → GET /v1/tasks/:id/results
 */

const BASE = 'https://api.metapi.io/v1';
const KEY  = process.env.METAPI_API_KEY || '';

const headers = () => ({
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
});

/* ── MetAPI response shapes ── */
export interface MetAPIAd {
  provider_id:            string;
  provider_page_id:       string;
  provider_page_name:     string;
  creation_time:          string | null;
  delivery_start_time:    string | null;
  delivery_stop_time:     string | null;
  cta_text:               string | null;
  bodies:                 string[];
  creative_link_titles:   string[];
  creative_link_descriptions: string[];
  captions:               string[];
  data_sources:           string[];   // ["FACEBOOK","INSTAGRAM",...]
  original_image_url:     string[];
  video_sd_url:           string[];
  video_hd_url:           string[];
  gender:                 string;
  age_from:               number;
  age_until:              number;
  page_profile_id:        string | null;
}

interface TaskStatus {
  task_id:          string;
  status:           'running' | 'succeeded' | 'failed';
  results_count:    number;
  progress_percent: number;
  error_message:    string | null;
}

/* ── 1. Create a task ── */
async function createTask(query: string, country = 'IN'): Promise<string> {
  const res = await fetch(`${BASE}/tasks`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({ q: query, country }),
  });
  if (!res.ok) throw new Error(`MetAPI createTask ${res.status}: ${await res.text()}`);
  const json = await res.json() as { task_id: string };
  return json.task_id;
}

/* ── 2. Poll until done (max 60 s) ── */
async function waitForTask(taskId: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/tasks/${taskId}/status`, { headers: headers() });
    if (!res.ok) throw new Error(`MetAPI status ${res.status}`);
    const json = await res.json() as TaskStatus;
    if (json.status === 'succeeded') return;
    if (json.status === 'failed')   throw new Error(`MetAPI task failed: ${json.error_message}`);
    // still running — keep polling
  }
  throw new Error('MetAPI task timed out after 60 s');
}

/* ── 3. Fetch results ── */
async function fetchResults(taskId: string): Promise<MetAPIAd[]> {
  const res = await fetch(`${BASE}/tasks/${taskId}/results`, { headers: headers() });
  if (!res.ok) throw new Error(`MetAPI results ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: MetAPIAd[] };
  return json.data || [];
}

/* ── Public: collect ads for a brand ── */
export async function getMetaAds(brandName: string): Promise<MetAPIAd[]> {
  if (!KEY) throw new Error('METAPI_API_KEY not set');
  const taskId = await createTask(brandName, 'IN');
  await waitForTask(taskId);
  return fetchResults(taskId);
}

/* ── Public: analyse raw ads into a summary ── */
export function analyzeMetaAds(ads: MetAPIAd[]) {
  if (!ads.length) {
    return {
      totalAds:        0,
      isActive:        false,
      lastAdDate:      null,
      daysSinceLastAd: null,
      platforms:       [] as string[],
      adCopySamples:   [] as ReturnType<typeof buildSamples>,
    };
  }

  // Sort by creation_time descending
  const sorted = [...ads].sort((a, b) => {
    const tA = a.creation_time ? new Date(a.creation_time).getTime() : 0;
    const tB = b.creation_time ? new Date(b.creation_time).getTime() : 0;
    return tB - tA;
  });

  const lastAdDate      = sorted[0].creation_time;
  const daysSinceLastAd = lastAdDate
    ? Math.floor((Date.now() - new Date(lastAdDate).getTime()) / 86_400_000)
    : null;

  // Unique platforms across all ads
  const platforms = Array.from(new Set(ads.flatMap(a => a.data_sources)));

  return {
    totalAds:        ads.length,
    isActive:        daysSinceLastAd !== null && daysSinceLastAd <= 30,
    lastAdDate,
    daysSinceLastAd,
    platforms,
    adCopySamples: buildSamples(sorted),
  };
}

function buildSamples(sorted: MetAPIAd[]) {
  return sorted
    .filter(a => a.bodies?.length)
    .slice(0, 5)
    .map(a => ({
      id:          a.provider_id,
      pageName:    a.provider_page_name,
      copy:        a.bodies[0]?.substring(0, 200),
      title:       a.creative_link_titles[0] ?? null,
      description: a.creative_link_descriptions[0] ?? null,
      cta:         a.cta_text,
      date:        a.creation_time,
      platforms:   a.data_sources,
      imageUrl:    a.original_image_url[0] ?? null,
    }));
}

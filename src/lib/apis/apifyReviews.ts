/**
 * Apify Google Reviews scraper — actor YVrEOM9F4GoyYkkUU
 *
 * Flow:
 *   1. POST /acts/{actorId}/runs  → get runId + defaultDatasetId
 *   2. Poll GET /actor-runs/{runId} until SUCCEEDED / FAILED (max 120 s)
 *   3. GET /datasets/{datasetId}/items  → raw review rows
 *   4. If 0 results and city was given → retry without city
 *   5. Aggregate stats server-side (no LLM)
 *   6. Use Groq to extract themes from truncated texts (cheap, fast)
 *   7. Return compact ReviewSummary — D7 only ever sees stats + 6 samples
 */

import { analyzeWithGroq } from '@/lib/groq';

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID   = 'YVrEOM9F4GoyYkkUU';
const TOKEN      = process.env.APIFY_TOKEN || '';

/* ── Apify response types ── */
interface ApifyRun {
  id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED';
  defaultDatasetId: string;
}

export interface ApifyReviewRow {
  placeUrl:             string;
  placeName:            string;
  placeAddress:         string;
  placeOverallRating:   number;
  placeTotalReviews:    number;
  reviewerName:         string;
  reviewerIsLocalGuide: boolean;
  reviewRating:         number;
  reviewText:           string | null;
  reviewDate:           string;
  reviewRelativeDate:   string;
  ownerResponse:        string | null;
  ownerResponseDate:    string | null;
}

/* ── Public return type ── */
export interface ReviewSummary {
  source:             'apify_google_reviews';
  placeName:          string | null;
  placeAddress:       string | null;
  placeUrl:           string | null;
  overallRating:      number | null;
  totalReviews:       number | null;
  fetchedCount:       number;
  ratingDistribution: Record<string, number>;
  above4Count:        number;
  above4Pct:          number;
  avgFetchedRating:   number | null;
  responseRate:       number;
  localGuideCount:    number;
  positiveThemes:     string[];
  negativeThemes:     string[];
  recentSamples:      ReviewSample[];
}

interface ReviewSample {
  rating:      number;
  text:        string;
  date:        string;
  hasResponse: boolean;
}

/* ── Step 1: start actor run ── */
async function startRun(query: string): Promise<ApifyRun> {
  const placeUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;

  const res = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${TOKEN}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placeUrls:          [placeUrl],
      maxReviewsPerPlace: 100,
      sortBy:             'newest',
      onlyWithText:       false,   // false = capture star-only reviews too (gives us placeOverallRating)
      language:           '',
    }),
  });
  if (!res.ok) throw new Error(`Apify startRun ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: ApifyRun };
  return json.data;
}

/* ── Step 2: poll until terminal state (max 120 s) ── */
async function waitForRun(runId: string, timeoutMs = 120_000): Promise<ApifyRun> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000));
    const res  = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${TOKEN}`);
    if (!res.ok) throw new Error(`Apify poll ${res.status}`);
    const json = await res.json() as { data: ApifyRun };
    const run  = json.data;
    if (run.status === 'SUCCEEDED') return run;
    if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(run.status)) {
      throw new Error(`Apify run ${run.status}`);
    }
  }
  throw new Error('Apify run timed out after 120 s');
}

/* ── Step 3: fetch dataset items ── */
async function fetchItems(datasetId: string): Promise<ApifyReviewRow[]> {
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${TOKEN}&limit=200`,
  );
  if (!res.ok) throw new Error(`Apify dataset ${res.status}`);
  return res.json() as Promise<ApifyReviewRow[]>;
}

/* ── Attempt a single search query, return rows ── */
async function runSearch(query: string): Promise<ApifyReviewRow[]> {
  const run      = await startRun(query);
  const finished = await waitForRun(run.id);
  return fetchItems(finished.defaultDatasetId);
}

/* ── Step 4: compute stats server-side ── */
function aggregateStats(rows: ApifyReviewRow[]): Omit<ReviewSummary, 'positiveThemes' | 'negativeThemes' | 'source'> {
  const first = rows[0];
  const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let ratingSum = 0, responseCount = 0, localGuideCount = 0;

  for (const r of rows) {
    const key = String(Math.round(r.reviewRating));
    if (key in dist) dist[key]++;
    ratingSum += r.reviewRating;
    if (r.ownerResponse)        responseCount++;
    if (r.reviewerIsLocalGuide) localGuideCount++;
  }

  const above4Count = (dist['4'] ?? 0) + (dist['5'] ?? 0);
  const above4Pct   = rows.length ? Math.round((above4Count / rows.length) * 100) : 0;

  // 3 most-recent positive + 3 most-recent negative with text
  const withText   = rows.filter(r => r.reviewText);
  const positive   = withText.filter(r => r.reviewRating >= 4).slice(0, 3);
  const negative   = withText.filter(r => r.reviewRating <= 2).slice(0, 3);
  const samples: ReviewSample[] = [...positive, ...negative].map(r => ({
    rating:      r.reviewRating,
    text:        (r.reviewText ?? '').slice(0, 200),
    date:        r.reviewDate,
    hasResponse: !!r.ownerResponse,
  }));

  return {
    placeName:          first?.placeName    ?? null,
    placeAddress:       first?.placeAddress ?? null,
    placeUrl:           first?.placeUrl     ?? null,
    overallRating:      first?.placeOverallRating ?? null,
    totalReviews:       first?.placeTotalReviews  ?? null,
    fetchedCount:       rows.length,
    ratingDistribution: dist,
    above4Count,
    above4Pct,
    avgFetchedRating:   rows.length
      ? Math.round((ratingSum / rows.length) * 10) / 10
      : null,
    responseRate:       rows.length
      ? Math.round((responseCount / rows.length) * 100)
      : 0,
    localGuideCount,
    recentSamples:      samples,
  };
}

/* ── Step 5: use Groq to extract themes from truncated text reviews ── */
async function extractThemes(rows: ApifyReviewRow[]): Promise<{ positiveThemes: string[]; negativeThemes: string[] }> {
  const fallback = { positiveThemes: [], negativeThemes: [] };
  if (!process.env.GROQ_API_KEY) return fallback;

  const textRows = rows.filter(r => r.reviewText);
  if (!textRows.length) return fallback;

  const corpus = textRows
    .slice(0, 60)
    .map((r, i) => `[${i + 1}][${r.reviewRating}★] ${(r.reviewText ?? '').slice(0, 120)}`)
    .join('\n');

  const prompt = `Analyse these Google reviews for a real estate developer and extract recurring themes.

REVIEWS:
${corpus}

Return ONLY this JSON (no prose, no markdown):
{"positiveThemes":["<3-5 word theme>"],"negativeThemes":["<3-5 word theme>"]}
Up to 5 themes each.`;

  try {
    const raw    = await analyzeWithGroq(prompt);
    const parsed = JSON.parse(raw) as { positiveThemes?: string[]; negativeThemes?: string[] };
    return {
      positiveThemes: parsed.positiveThemes ?? [],
      negativeThemes: parsed.negativeThemes ?? [],
    };
  } catch (err) {
    console.warn('[apifyReviews] Groq theme extraction failed:', err instanceof Error ? err.message : err);
    return fallback;
  }
}

/* ── Public entry point ── */
export async function getGoogleReviewsSummary(
  brandName: string,
  city?: string,
): Promise<ReviewSummary> {
  if (!TOKEN) throw new Error('APIFY_TOKEN not set');

  // Try with city first, fall back to brand name only if 0 results
  let rows: ApifyReviewRow[] = [];

  if (city) {
    rows = await runSearch(`${brandName} ${city}`);
    if (rows.length === 0) {
      console.log(`[apifyReviews] 0 results for "${brandName} ${city}", retrying without city`);
      rows = await runSearch(brandName);
    }
  } else {
    rows = await runSearch(brandName);
  }

  if (rows.length === 0) {
    return {
      source:             'apify_google_reviews',
      placeName: null, placeAddress: null, placeUrl: null,
      overallRating: null, totalReviews: null,
      fetchedCount: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      above4Count: 0, above4Pct: 0,
      avgFetchedRating: null, responseRate: 0, localGuideCount: 0,
      positiveThemes: [], negativeThemes: [],
      recentSamples: [],
    };
  }

  const [stats, themes] = await Promise.all([
    Promise.resolve(aggregateStats(rows)),
    extractThemes(rows),
  ]);

  return { source: 'apify_google_reviews', ...stats, ...themes };
}

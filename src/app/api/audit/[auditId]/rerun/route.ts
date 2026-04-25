import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

const WEIGHTS: Record<string, number> = {
  D1: 8, D2: 12, D3: 10, D4: 12, D5: 8, D6: 8, D7: 15, D8: 10, D9: 9, D10: 8,
};

/** Which collect tasks each dimension needs */
const DIMENSION_SOURCES: Record<string, string[]> = {
  D1:  ['PDL', 'DataForSEO'],
  D2:  ['WebCrawler', 'DataForSEO', 'Screenshot'],
  D3:  ['HikerAPI', 'PDL'],
  D4:  ['MetaAdLibrary'],
  D5:  ['Screenshot'],
  D6:  ['WebCrawler'],
  D7:  ['Reviews'],
  D8:  ['WebCrawler', 'DataForSEO'],
  D9:  ['Reviews', 'HikerAPI', 'DataForSEO'],
  D10: ['WebCrawler', 'PDL', 'PromoterLinkedIn'],
};

type CollectTask = {
  source: string;
  urlKey: string;
  enabled: boolean;
  body: Record<string, string | boolean | undefined>;
};

function buildCollectTasks(
  source: string,
  dev: Record<string, string | undefined>,
  auditId: string
): CollectTask | null {
  switch (source) {
    case 'PDL':
      return { source, urlKey: 'company-data', enabled: !!(dev.domain || dev.brandName), body: { domain: dev.domain, brandName: dev.brandName, auditId } };
    case 'Reviews':
      return { source, urlKey: 'gmb', enabled: !!dev.brandName, body: { placeId: dev.gmbPlaceId, auditId } };
    case 'DataForSEO':
      return { source, urlKey: 'seo', enabled: !!(dev.domain || dev.brandName), body: { domain: dev.domain, brandName: dev.brandName, auditId } };
    case 'WebCrawler':
      return { source, urlKey: 'website', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, auditId } };
    case 'HikerAPI':
      return { source, urlKey: 'instagram', enabled: !!(dev.instagramHandle || dev.facebookUrl || dev.linkedinUrl), body: { instagramHandle: dev.instagramHandle, auditId } };
    case 'MetaAdLibrary':
      return { source, urlKey: 'meta-ads', enabled: true, body: { brandName: dev.metaAdLibraryName || dev.brandName, auditId } };
    case 'Screenshot':
      return { source, urlKey: 'screenshot', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, domain: dev.domain, auditId } };
    case 'PromoterLinkedIn':
      return { source, urlKey: 'promoter-linkedin', enabled: !!dev.promoterLinkedIn, body: { auditId } };
    default:
      return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { auditId: string } }) {
  const { auditId } = params;
  const dimension = (req.nextUrl.searchParams.get('dimension') ?? '').toUpperCase();
  const skipCollection = req.nextUrl.searchParams.get('skipCollection') === 'true';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
        catch { /* stream closed */ }
      }

      try {
        if (!dimension || !DIMENSION_SOURCES[dimension]) {
          send({ stage: 'error', message: `Unknown dimension: ${dimension}` });
          return;
        }

        await connectDB();
        const audit = await Audit.findById(auditId).lean();
        if (!audit) { send({ stage: 'error', message: 'Audit not found' }); return; }
        const dev = await Developer.findById(audit.developerId).lean() as Record<string, string | undefined> | null;
        if (!dev) { send({ stage: 'error', message: 'Developer not found' }); return; }

        const sourcesNeeded = DIMENSION_SOURCES[dimension];

        // ── Collection phase (skipped when skipCollection=true) ───────────────
        if (!skipCollection) {
          send({ stage: 'collecting', message: `Re-collecting data for ${dimension}…` });

          const tasks = sourcesNeeded
            .map(s => buildCollectTasks(s, dev as Record<string, string | undefined>, auditId))
            .filter((t): t is CollectTask => t !== null && t.enabled);

          await Promise.allSettled(
            tasks.map(async (task) => {
              send({ stage: 'collecting', source: task.source, status: 'in_progress' });
              try {
                const res = await fetch(`${BASE_URL}/api/collect/${task.urlKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(task.body),
                });
                const json = res.ok ? await res.json().catch(() => ({})) : {};
                const ok = json.success !== false && res.ok;
                send({ stage: 'collecting', source: task.source, status: ok ? 'done' : 'failed' });
              } catch {
                send({ stage: 'collecting', source: task.source, status: 'failed' });
              }
            })
          );
        } else {
          send({ stage: 'collecting', message: 'Collection skipped — using manual data', status: 'done' });
        }

        // ── Analysis phase ────────────────────────────────────────────────────
        send({ stage: 'analyzing', dimension, status: 'in_progress', message: `Re-analyzing ${dimension}…` });

        const dimRoute = dimension.toLowerCase(); // 'd1' … 'd10'
        const analyzeRes = await fetch(`${BASE_URL}/api/analyze/${dimRoute}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditId }),
        });
        const analyzeJson = await analyzeRes.json().catch(() => ({ success: false }));

        if (analyzeJson.success === false) {
          send({ stage: 'analyzing', dimension, status: 'failed' });
          send({ stage: 'error', message: analyzeJson.error || 'Analysis failed' });
          return;
        }

        const newScore: number | null = analyzeJson.score ?? null;
        send({ stage: 'analyzing', dimension, status: 'done', score: newScore });

        // ── Recalculate overall score ─────────────────────────────────────────
        const freshAudit = await Audit.findById(auditId).lean() as {
          dimensions?: Array<{ code: string; score?: number | null; status?: string }>;
        } | null;

        let overallScore: number | null = null;
        if (freshAudit) {
          let totalWeight = 0;
          let weightedSum = 0;
          for (const d of freshAudit.dimensions ?? []) {
            if (d.score == null) continue;
            const w = WEIGHTS[d.code] ?? 0;
            weightedSum += d.score * w;
            totalWeight += w;
          }
          overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

          // Mark audit COMPLETE when every dimension has been analyzed
          const allDimCodes = Object.keys(WEIGHTS); // D1…D10
          const allAnalyzed = allDimCodes.every(code => {
            const d = (freshAudit.dimensions ?? []).find(d => d.code === code);
            return d && (d.status === 'complete' || d.status === 'insufficient_data');
          });

          await Audit.findByIdAndUpdate(auditId, {
            overallScore,
            ...(allAnalyzed ? { status: 'COMPLETE' } : {}),
          });
        }

        send({ stage: 'complete', dimension, score: newScore, overallScore });
      } catch (err) {
        send({ stage: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

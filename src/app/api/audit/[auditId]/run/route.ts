import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Use localhost for internal server-to-server calls — avoids routing through the public internet
const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

export async function GET(_req: NextRequest, { params }: { params: { auditId: string } }) {
  const { auditId } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* stream may be closed */ }
      }

      try {
        await connectDB();
        const audit = await Audit.findById(auditId).lean();
        if (!audit) {
          send({ stage: 'error', message: 'Audit not found' });
          return;
        }
        const dev = await Developer.findById(audit.developerId).lean();
        if (!dev) {
          send({ stage: 'error', message: 'Developer not found' });
          return;
        }

        await Audit.findByIdAndUpdate(auditId, { status: 'COLLECTING' });
        send({ stage: 'collecting', message: 'Starting data collection...' });

        // Parallel collection — all 7 sources run concurrently via Promise.allSettled
        const collectTasks = [
          { key: 'companyData', source: 'PDL', enabled: !!dev.domain, body: { domain: dev.domain, brandName: dev.brandName, auditId, developerId: String((dev as { _id: unknown })._id) } },
          { key: 'gmb', source: 'Reviews', enabled: !!dev.brandName, body: { placeId: dev.gmbPlaceId, auditId } },
          { key: 'seo', source: 'DataForSEO', enabled: !!dev.domain || !!dev.brandName, body: { domain: dev.domain, brandName: dev.brandName, auditId } },
          { key: 'website', source: 'WebCrawler', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, auditId } },
          { key: 'instagram', source: 'HikerAPI', enabled: !!(dev.instagramHandle || dev.facebookUrl || dev.linkedinUrl), body: { instagramHandle: dev.instagramHandle, auditId } },
          { key: 'metaAds', source: 'MetaAdLibrary', enabled: true, body: { brandName: (dev as { metaAdLibraryName?: string }).metaAdLibraryName || dev.brandName, auditId } },
          { key: 'screenshot', source: 'Screenshot', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, domain: dev.domain, auditId } },
          { key: 'promoter-linkedin', source: 'PromoterLinkedIn', enabled: !!(dev as { promoterLinkedIn?: string }).promoterLinkedIn, body: { auditId } },
        ];

        const collectedSources: string[] = [];
        const failedSources: string[] = [];

        await Promise.allSettled(
          collectTasks.filter(t => t.enabled).map(async (task) => {
            send({ stage: 'collecting', source: task.source, status: 'in_progress' });
            try {
              const urlKey = task.key === 'companyData' ? 'company-data' : task.key === 'metaAds' ? 'meta-ads' : task.key;
              const res = await fetch(`${BASE_URL}/api/collect/${urlKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task.body),
              });

              // Collect routes always return 200 — check success field
              let succeeded = res.ok;
              if (res.ok) {
                try {
                  const json = await res.json();
                  succeeded = json.success !== false;
                  if (!succeeded) {
                    console.error(`[collect/${task.source}] API reported failure: ${json.error}`);
                  }
                } catch { /* response not JSON */ }
              }

              if (succeeded) {
                collectedSources.push(task.source);
                send({ stage: 'collecting', source: task.source, status: 'done' });
              } else {
                failedSources.push(task.source);
                send({ stage: 'collecting', source: task.source, status: 'failed' });
              }
            } catch (err) {
              console.error(`Collection failed for ${task.source}:`, err instanceof Error ? err.message : err);
              failedSources.push(task.source);
              send({ stage: 'collecting', source: task.source, status: 'failed' });
            }
          })
        );

        // Log and persist data source status
        console.log(`[audit/${auditId}] Collection done. Collected: [${collectedSources.join(', ')}]. Failed: [${failedSources.join(', ')}]`);
        await Audit.findByIdAndUpdate(auditId, {
          status: 'ANALYZING',
          dataSourceStatus: { collected: collectedSources, failed: failedSources },
        });

        send({
          stage: 'analyzing',
          message: 'Starting AI analysis...',
          collectedSources,
          failedSources,
        });

        // Sequential analysis — continue regardless of collection failures
        const WEIGHTS: Record<string, number> = { D1: 8, D2: 12, D3: 10, D4: 12, D5: 8, D6: 8, D7: 15, D8: 10, D9: 9, D10: 8 };
        const dimensionScores: Record<string, number | null> = {};

        for (const dim of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']) {
          const code = dim.toUpperCase();
          send({ stage: 'analyzing', dimension: code, status: 'in_progress' });
          try {
            const res = await fetch(`${BASE_URL}/api/analyze/${dim}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ auditId }),
            });
            // Analyze routes always return 200
            const result = await res.json();
            if (result.success !== false) {
              // null score means insufficient data — exclude from overall
              dimensionScores[code] = result.score ?? null;
              send({ stage: 'analyzing', dimension: code, status: 'done', score: result.score ?? null });
            } else {
              console.error(`[analyze/${code}] failed: ${result.error}`);
              send({ stage: 'analyzing', dimension: code, status: 'failed' });
            }
          } catch (err) {
            console.error(`Analysis failed for ${code}:`, err instanceof Error ? err.message : err);
            send({ stage: 'analyzing', dimension: code, status: 'failed' });
          }
        }

        // Calculate overall score — exclude null (insufficient data) dimensions
        let totalWeight = 0;
        let weightedSum = 0;
        for (const [dim, score] of Object.entries(dimensionScores)) {
          if (score === null) continue; // insufficient data — skip
          const w = WEIGHTS[dim] || 0;
          weightedSum += score * w;
          totalWeight += w;
        }
        const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

        // Run collateral analysis (Groq, from uploaded docs) — non-blocking, won't fail the audit
        try {
          await fetch(`${BASE_URL}/api/analyze/collateral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auditId }),
          });
        } catch (err) {
          console.error('[collateral] analysis failed:', err instanceof Error ? err.message : err);
        }

        await Audit.findByIdAndUpdate(auditId, { status: 'COMPLETE', overallScore });
        send({ stage: 'complete', overallScore, collectedSources, failedSources });
      } catch (error) {
        console.error('Run audit error:', error);
        try { await Audit.findByIdAndUpdate(auditId, { status: 'FAILED' }); } catch { /* ignore */ }
        send({ stage: 'error', message: 'Audit failed. Please try again.' });
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

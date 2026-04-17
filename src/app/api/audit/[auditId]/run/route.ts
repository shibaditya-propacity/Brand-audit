import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
          controller.close();
          return;
        }
        const dev = await Developer.findById(audit.developerId).lean();
        if (!dev) {
          send({ stage: 'error', message: 'Developer not found' });
          controller.close();
          return;
        }

        await Audit.findByIdAndUpdate(auditId, { status: 'COLLECTING' });
        send({ stage: 'collecting', message: 'Starting data collection...' });

        // Parallel collection
        const collectTasks = [
          { key: 'companyData', source: 'PDL', enabled: !!dev.domain, body: { domain: dev.domain, brandName: dev.brandName, auditId } },
          { key: 'gmb', source: 'GooglePlaces', enabled: !!dev.gmbPlaceId, body: { placeId: dev.gmbPlaceId, auditId } },
          { key: 'seo', source: 'DataForSEO', enabled: !!dev.domain || !!dev.brandName, body: { domain: dev.domain, brandName: dev.brandName, auditId } },
          { key: 'website', source: 'WebCrawler', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, auditId } },
          { key: 'instagram', source: 'HikerAPI', enabled: !!dev.instagramHandle, body: { instagramHandle: dev.instagramHandle, auditId } },
          { key: 'metaAds', source: 'MetaAdLibrary', enabled: true, body: { brandName: dev.metaAdLibraryName || dev.brandName, auditId } },
          { key: 'screenshot', source: 'Screenshot', enabled: !!dev.websiteUrl, body: { websiteUrl: dev.websiteUrl, domain: dev.domain, auditId } },
        ];

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
              send({ stage: 'collecting', source: task.source, status: res.ok ? 'done' : 'failed' });
            } catch (err) {
              console.error(`Collection failed for ${task.source}:`, err);
              send({ stage: 'collecting', source: task.source, status: 'failed' });
            }
          })
        );

        // Sequential analysis
        await Audit.findByIdAndUpdate(auditId, { status: 'ANALYZING' });
        send({ stage: 'analyzing', message: 'Starting AI analysis...' });

        const WEIGHTS: Record<string, number> = { D1: 8, D2: 12, D3: 10, D4: 12, D5: 8, D6: 8, D7: 15, D8: 10, D9: 9, D10: 8 };
        const dimensionScores: Record<string, number> = {};

        for (const dim of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']) {
          const code = dim.toUpperCase();
          send({ stage: 'analyzing', dimension: code, status: 'in_progress' });
          try {
            const res = await fetch(`${BASE_URL}/api/analyze/${dim}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ auditId }),
            });
            if (res.ok) {
              const result = await res.json();
              dimensionScores[code] = result.score || 0;
              send({ stage: 'analyzing', dimension: code, status: 'done', score: result.score });
            } else {
              send({ stage: 'analyzing', dimension: code, status: 'failed' });
            }
          } catch (err) {
            console.error(`Analysis failed for ${code}:`, err);
            send({ stage: 'analyzing', dimension: code, status: 'failed' });
          }
        }

        // Calculate overall score
        let totalWeight = 0;
        let weightedSum = 0;
        for (const [dim, score] of Object.entries(dimensionScores)) {
          const w = WEIGHTS[dim] || 0;
          weightedSum += score * w;
          totalWeight += w;
        }
        const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

        await Audit.findByIdAndUpdate(auditId, { status: 'COMPLETE', overallScore });
        send({ stage: 'complete', overallScore });
      } catch (error) {
        console.error('Run audit error:', error);
        try { await Audit.findByIdAndUpdate(auditId, { status: 'FAILED' }); } catch { /* ignore */ }
        send({ stage: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
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

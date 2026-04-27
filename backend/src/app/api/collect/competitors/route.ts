import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { searchCompetitors } from '@/lib/apis/dataForSeo';

/** Extract meaningful keywords from Serper organic SERP titles/snippets */
function extractKeywordsFromSerp(serpData: unknown): string[] {
  const data = serpData as { organic?: Array<{ title?: string; snippet?: string }> } | null;
  if (!data?.organic?.length) return [];

  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'your',
    'our', 'best', 'top', 'real', 'estate', 'property', 'properties',
    'india', 'in', 'of', 'a', 'an', 'to', 'is', 'it', 'be', 'as', 'at',
    'by', 'we', 'you', 'or', 'on', 'do', 'if', 'so', 'up', 'how',
  ]);

  const freq: Record<string, number> = {};
  for (const item of data.organic.slice(0, 8)) {
    const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    for (const w of words) {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    if (!auditId) return NextResponse.json({ success: false, error: 'auditId required' }, { status: 400 });

    await connectDB();
    const audit = await Audit.findById(auditId).lean();
    if (!audit) return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });

    const dev = await Developer.findById(audit.developerId).lean();
    if (!dev) return NextResponse.json({ success: false, error: 'Developer not found' }, { status: 404 });

    const serpKeywords = extractKeywordsFromSerp(audit.collectedData?.seoKeywords);

    console.log('[competitors] brand:', dev.brandName, '| city:', dev.city, '| product:', dev.productType, '| keywords:', serpKeywords);

    const competitors = await searchCompetitors(
      dev.brandName,
      dev.productType || '',
      dev.city || '',
      serpKeywords,
    );

    console.log('[competitors] found:', competitors.length);

    const competitorData = {
      competitors,
      keywords: serpKeywords,
      collectedAt: new Date().toISOString(),
    };

    // Use $set with upsert-safe update; initialize collectedData if missing
    await Audit.findByIdAndUpdate(
      auditId,
      { $set: { 'collectedData.competitorData': competitorData } },
      { new: true },
    );

    return NextResponse.json({ success: true, competitors, keywords: serpKeywords });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Competitor search failed';
    console.error('[competitors] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

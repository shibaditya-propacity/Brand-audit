import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { extractWithGroq } from '@/lib/groq';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function buildCollateralPrompt(
  brandName: string,
  docs: Array<{ name: string; textContent: string }>,
): string {
  const docSections = docs
    .map((d, i) => `=== Document ${i + 1}: ${d.name} ===\n${d.textContent}`)
    .join('\n\n');

  return `You are a brand analyst. Analyze ONLY the collateral documents provided below — do not use any external knowledge or assumptions about the brand.

Brand: ${brandName}

${docSections}

Return a JSON object (no markdown, no explanation) matching this exact shape:
{
  "summary": "2-3 sentence overview of what the collateral communicates",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "marketPositioning": "How the brand positions itself based on these documents",
  "score": <integer 0-100 reflecting collateral quality and completeness>,
  "gaps": ["gap or missing element 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Rules:
- Base everything strictly on the document content above.
- If a field cannot be determined from the documents, use a brief "Not determinable from provided documents" value.
- score: 100 = exceptional collateral, 0 = no useful content found.
- Output ONLY the JSON object, nothing else.`;
}

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();
    if (!auditId) {
      return NextResponse.json({ success: false, error: 'auditId required' }, { status: 400 });
    }

    await connectDB();
    const audit = await Audit.findById(auditId).lean() as { developerId: unknown } | null;
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    const dev = await Developer.findById(audit.developerId).lean() as {
      brandName: string;
      collateralDocs?: Array<{ name: string; textContent: string }>;
    } | null;

    if (!dev) {
      return NextResponse.json({ success: false, error: 'Developer not found' }, { status: 404 });
    }

    const docs = (dev.collateralDocs ?? []).filter(d => d.textContent?.trim());
    if (docs.length === 0) {
      // No docs — store a sentinel so the panel can show the warning
      await Audit.findByIdAndUpdate(auditId, {
        'collectedData.collateralAnalysis': null,
      });
      return NextResponse.json({ success: true, skipped: true, reason: 'No collateral documents uploaded' });
    }

    const prompt = buildCollateralPrompt(dev.brandName, docs);
    const raw = await extractWithGroq(prompt, 1024);

    let result: Record<string, unknown>;
    try {
      // Strip markdown fences if Groq wraps the output
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse Groq response',
        raw,
      });
    }

    const analysis = {
      summary: String(result.summary ?? ''),
      keyFindings: Array.isArray(result.keyFindings) ? result.keyFindings.map(String) : [],
      marketPositioning: String(result.marketPositioning ?? ''),
      score: typeof result.score === 'number' ? Math.min(100, Math.max(0, Math.round(result.score))) : 0,
      gaps: Array.isArray(result.gaps) ? result.gaps.map(String) : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations.map(String) : [],
      docsAnalyzed: docs.length,
      analyzedAt: new Date().toISOString(),
    };

    await Audit.findByIdAndUpdate(auditId, {
      'collectedData.collateralAnalysis': analysis,
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Collateral analysis failed';
    console.error('[analyze/collateral]', msg);
    return NextResponse.json({ success: false, error: msg });
  }
}

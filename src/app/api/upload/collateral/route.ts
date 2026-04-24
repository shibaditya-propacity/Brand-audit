import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TEXT_CHARS = 60_000; // truncate very long PDFs before sending to LLM

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'Only PDF files are accepted' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds 10 MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import avoids build issues with pdf-parse's internal require() calls.
    // The ESM build exports the function as the module itself (no .default wrapper).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pdf-parse');
    const pdfParse = (mod.default ?? mod) as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const parsed = await pdfParse(buffer);

    const textContent = parsed.text.slice(0, MAX_TEXT_CHARS).trim();
    const name = file.name.replace(/\.pdf$/i, '');

    return NextResponse.json({
      success: true,
      name,
      textContent,
      pages: parsed.numpages,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'PDF extraction failed';
    console.error('[upload/collateral]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

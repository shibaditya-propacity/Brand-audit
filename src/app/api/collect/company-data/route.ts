import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Developer } from '@/lib/models';
import { enrichCompany, extractCompanyData } from '@/lib/apis/pdl';

export async function POST(request: NextRequest) {
  try {
    const { domain, brandName, auditId, developerId } = await request.json();
    let pdlData = null;
    let extracted = null;

    if (domain) {
      try {
        pdlData = await enrichCompany(domain);
        if (pdlData && developerId) {
          await connectDB();
          await Developer.findByIdAndUpdate(developerId, { pdlData });
          extracted = extractCompanyData(pdlData);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Company data API error:', msg);
        return NextResponse.json({ success: false, data: null, error: msg });
      }
    }

    // auditId noted but PDL data goes on developer, not collectedData
    void auditId;
    return NextResponse.json({ success: true, data: { pdlData, extracted, brandName }, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect company data';
    console.error('Company data collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

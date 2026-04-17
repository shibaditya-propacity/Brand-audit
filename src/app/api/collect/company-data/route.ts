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
      pdlData = await enrichCompany(domain);
      if (pdlData && developerId) {
        await connectDB();
        await Developer.findByIdAndUpdate(developerId, { pdlData });
        extracted = extractCompanyData(pdlData);
      }
    }
    // auditId noted but PDL data goes on developer, not collectedData
    void auditId;
    return NextResponse.json({ pdlData, extracted, brandName });
  } catch (error) {
    console.error('Company data collection error:', error);
    return NextResponse.json({ error: 'Failed to collect company data' }, { status: 500 });
  }
}

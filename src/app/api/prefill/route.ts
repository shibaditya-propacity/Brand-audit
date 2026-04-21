import { NextRequest, NextResponse } from 'next/server';
import { autocompletePlace, getPlaceDetails } from '@/lib/apis/googlePlaces';
import { enrichCompany, extractCompanyData } from '@/lib/apis/pdl';
import { checkClearbitLogo } from '@/lib/apis/shotApi';

function extractDomain(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { brandName, domain: providedDomain } = await request.json();
    if (!brandName) {
      return NextResponse.json({ success: false, error: 'brandName required' });
    }

    // Step 1 – search Google Places by brand name
    let googleData: {
      placeId: string | null;
      name: string | null;
      address: string | null;
      website: string | null;
      phone: string | null;
      rating: number | null;
    } = { placeId: null, name: null, address: null, website: null, phone: null, rating: null };

    try {
      const places = await autocompletePlace(brandName);
      const first = places[0] ?? null;
      if (first?.place_id) {
        const details = await getPlaceDetails(first.place_id);
        googleData = {
          placeId: first.place_id,
          name: details?.name ?? first.structured_formatting?.main_text ?? null,
          address: details?.formatted_address ?? first.description ?? null,
          website: details?.website ?? null,
          phone: details?.formatted_phone_number ?? null,
          rating: details?.rating ?? null,
        };
      }
    } catch (err) {
      console.error('[prefill] Google Places error:', err instanceof Error ? err.message : err);
    }

    // Step 2 – resolve domain (from Places website or provided)
    const domain = providedDomain || extractDomain(googleData.website);

    // Step 3 – PDL + Clearbit in parallel
    const [pdlResult, logoResult] = await Promise.allSettled([
      domain ? enrichCompany(domain) : Promise.resolve(null),
      domain ? checkClearbitLogo(domain) : Promise.resolve(null),
    ]);

    const pdlRaw = pdlResult.status === 'fulfilled' ? pdlResult.value : null;
    const pdlData = pdlRaw ? extractCompanyData(pdlRaw) : null;
    const logoUrl = logoResult.status === 'fulfilled' ? logoResult.value : null;

    if (pdlResult.status === 'rejected') {
      console.error('[prefill] PDL error:', pdlResult.reason);
    }

    return NextResponse.json({
      success: true,
      data: {
        google: googleData,
        pdl: pdlData ? {
          industry: pdlData.industry ?? null,
          employeeCount: pdlData.employeeCount ?? null,
          foundedYear: pdlData.founded ?? null,
          linkedinUrl: pdlData.socialLinks?.linkedin ?? null,
          twitterUrl: pdlData.socialLinks?.twitter ?? null,
          facebookUrl: pdlData.socialLinks?.facebook ?? null,
          instagramUrl: pdlData.socialLinks?.instagram ?? null,
          youtubeUrl: pdlData.socialLinks?.youtube ?? null,
        } : null,
        logoUrl,
        resolvedDomain: domain,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Prefill lookup failed';
    console.error('[prefill] error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getPlaceDetails } from '@/lib/apis/googlePlaces';

export async function POST(request: NextRequest) {
  try {
    const { placeId, auditId } = await request.json();
    if (!placeId) {
      return NextResponse.json({ success: false, data: null, error: 'placeId required' });
    }

    let details = null;
    try {
      details = await getPlaceDetails(placeId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('GMB API error:', msg);
      return NextResponse.json({ success: false, data: null, error: msg });
    }

    if (details && auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.gmbData': details });
    }

    const data = {
      rating: details?.rating ?? null,
      reviewCount: details?.user_ratings_total ?? null,
      address: details?.formatted_address ?? null,
      website: details?.website ?? null,
      phone: details?.formatted_phone_number ?? null,
      reviews: (details as { reviews?: unknown[] } | null)?.reviews?.slice(0, 10) ?? [],
    };

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect GMB data';
    console.error('GMB collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

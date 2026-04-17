import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getPlaceDetails } from '@/lib/apis/googlePlaces';

export async function POST(request: NextRequest) {
  try {
    const { placeId, auditId } = await request.json();
    if (!placeId) return NextResponse.json({ error: 'placeId required' }, { status: 400 });

    const details = await getPlaceDetails(placeId);
    if (details && auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.gmbData': details });
    }
    return NextResponse.json({
      rating: details?.rating,
      reviewCount: details?.user_ratings_total,
      address: details?.formatted_address,
      website: details?.website,
      phone: details?.formatted_phone_number,
      reviews: details?.reviews?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error('GMB collection error:', error);
    return NextResponse.json({ error: 'Failed to collect GMB data' }, { status: 500 });
  }
}

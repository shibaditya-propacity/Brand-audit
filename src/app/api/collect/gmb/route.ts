import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { getPlaceDetails, getGooglePlaceReviews, getSerperPlaceRating } from '@/lib/apis/googlePlaces';

export async function POST(request: NextRequest) {
  try {
    const { placeId, auditId } = await request.json();

    await connectDB();
    const audit = auditId ? await Audit.findById(auditId).lean() : null;
    const dev = audit ? await Developer.findById(audit.developerId).lean() : null;

    // 1. Geoapify place details (address, basic rating)
    let geoapifyDetails = null;
    if (placeId) {
      try {
        geoapifyDetails = await getPlaceDetails(placeId);
      } catch (err) {
        console.error('Geoapify GMB error:', err instanceof Error ? err.message : err);
      }
    }

    // 2. Google Places API for real reviews (needs GOOGLE_PLACES_API_KEY)
    //    Falls back to Serper knowledge graph for rating when key is absent
    let reviewData = null;
    if (dev?.brandName) {
      if (process.env.GOOGLE_PLACES_API_KEY) {
        reviewData = await getGooglePlaceReviews(dev.brandName, dev.city ?? undefined);
      } else {
        // Serper fallback — gets rating/count from knowledge graph, no review text
        const serperRating = await getSerperPlaceRating(dev.brandName, dev.city ?? undefined);
        reviewData = {
          ...serperRating,
          website: null,
          phone: null,
          reviews: [],
        };
      }
    }

    // Merge: prefer Google Places data; fill gaps from Geoapify
    const merged = {
      rating: reviewData?.rating ?? geoapifyDetails?.rating ?? null,
      user_ratings_total: reviewData?.user_ratings_total ?? geoapifyDetails?.user_ratings_total ?? null,
      address: reviewData?.address ?? geoapifyDetails?.formatted_address ?? null,
      website: reviewData?.website ?? geoapifyDetails?.website ?? null,
      phone: reviewData?.phone ?? geoapifyDetails?.formatted_phone_number ?? null,
      reviews: reviewData?.reviews ?? [],
      reviewsSource: reviewData?.source ?? 'none',
    };

    if (auditId) {
      await Audit.findByIdAndUpdate(auditId, {
        $set: {
          'collectedData.gmbData': merged,
          'collectedData.googleReviews': merged.reviews.length > 0 ? merged.reviews : null,
        },
      });
    }

    return NextResponse.json({ success: true, data: merged, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect GMB data';
    console.error('GMB collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

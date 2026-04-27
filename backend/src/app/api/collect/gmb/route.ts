import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';
import { getPlaceDetails, getSerperPlaceRating } from '@/lib/apis/googlePlaces';
import { getGoogleReviewsSummary, type ReviewSummary } from '@/lib/apis/apifyReviews';

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const { placeId, auditId } = await request.json();

    await connectDB();
    const audit = auditId ? await Audit.findById(auditId).lean() : null;
    const dev   = audit   ? await Developer.findById(audit.developerId).lean() : null;

    // ── 1. Geoapify place details (address/basic rating) — optional ──────────
    let geoapifyDetails = null;
    if (placeId) {
      try {
        geoapifyDetails = await getPlaceDetails(placeId);
      } catch (err) {
        console.error('[gmb] Geoapify error:', err instanceof Error ? err.message : err);
      }
    }

    // ── 2. Apify Google Reviews scraper ─────────────────────────────────────
    let reviewSummary: ReviewSummary | null = null;

    if (dev?.brandName) {
      try {
        reviewSummary = await getGoogleReviewsSummary(
          dev.brandName,
          (dev as { city?: string }).city ?? undefined,
        );
        console.log(
          `[gmb] Apify: ${reviewSummary.fetchedCount} reviews, rating=${reviewSummary.overallRating} for "${dev.brandName}"`,
        );
      } catch (err) {
        console.error('[gmb] Apify reviews failed:', err instanceof Error ? err.message : err);
      }
    }

    // ── 3. Serper fallback — runs if Apify failed OR returned nothing useful ──
    let serperData: { rating: number | null; user_ratings_total: number | null; address: string | null } | null = null;

    const apifyHasRating = reviewSummary?.overallRating != null;

    if (!apifyHasRating && dev?.brandName) {
      try {
        serperData = await getSerperPlaceRating(
          dev.brandName,
          (dev as { city?: string }).city ?? undefined,
        );
        console.log(`[gmb] Serper fallback: rating=${serperData.rating}`);
      } catch (err) {
        console.error('[gmb] Serper fallback failed:', err instanceof Error ? err.message : err);
      }
    }

    // ── 4. Build minimal ReviewSummary from Serper if Apify gave nothing ─────
    //    This ensures googleReviews is never null when we at least have a rating.
    if (!reviewSummary && serperData?.rating != null) {
      reviewSummary = {
        source:             'apify_google_reviews',
        placeName:          null,
        placeAddress:       serperData.address,
        placeUrl:           null,
        overallRating:      serperData.rating,
        totalReviews:       serperData.user_ratings_total,
        fetchedCount:       0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        above4Count:        0,
        above4Pct:          0,
        avgFetchedRating:   null,
        responseRate:       0,
        localGuideCount:    0,
        positiveThemes:     [],
        negativeThemes:     [],
        recentSamples:      [],
      };
    }

    // ── 5. Merge into gmbData (used by D7 header card) ────────────────────
    const gmbData = {
      rating:             reviewSummary?.overallRating ?? geoapifyDetails?.rating ?? null,
      user_ratings_total: reviewSummary?.totalReviews  ?? geoapifyDetails?.user_ratings_total ?? null,
      address:            reviewSummary?.placeAddress  ?? geoapifyDetails?.formatted_address  ?? null,
      website:            geoapifyDetails?.website     ?? null,
      phone:              geoapifyDetails?.formatted_phone_number ?? null,
      reviewsSource:      reviewSummary
        ? (reviewSummary.fetchedCount > 0 ? 'apify' : 'serper_fallback')
        : 'none',
    };

    if (auditId) {
      await Audit.findByIdAndUpdate(auditId, {
        $set: {
          'collectedData.gmbData':       gmbData,
          'collectedData.googleReviews': reviewSummary ?? null,
        },
      });
    }

    // Always succeed — partial data is better than a failed collection
    return NextResponse.json({ success: true, data: { gmbData, reviewSummary }, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect GMB data';
    console.error('[gmb] collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

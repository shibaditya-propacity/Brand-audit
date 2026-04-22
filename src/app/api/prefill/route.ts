import { NextRequest, NextResponse } from 'next/server';
import { getSerpResults, getPlacesResults, getSocialProfileUrl } from '@/lib/apis/dataForSeo';
import { scrapeSocialLinks } from '@/lib/apis/socialScraper';
import { checkClearbitLogo } from '@/lib/apis/shotApi';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { extractFieldFromText } from '@/lib/groq';

function extractDomain(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractInstagramHandle(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)\/?/);
  return m ? m[1] : null;
}

interface SerperKnowledgeGraph {
  website?: string;
  type?: string;
  attributes?: Record<string, string>;
  profiles?: Array<{ link?: string }>;
  description?: string;
}

interface SerperLocalResult {
  address?: string;
  phone?: string;
  website?: string;
}

interface SerperResult {
  knowledgeGraph?: SerperKnowledgeGraph;
  localResults?: SerperLocalResult[];
  organic?: Array<{ link: string }>;
}

interface PlacesResult {
  places?: Array<{
    title?: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
  }>;
}

interface SerperExtracted {
  website: string | null;
  industry: string | null;
  foundedYear: string | null;
  headquarters: string | null;
  phone: string | null;
  description: string | null;
  promoterName: string | null;
  socialLinks: Record<string, string | null>;
}

function extractFromSerper(serper: SerperResult): SerperExtracted {
  const kg = serper?.knowledgeGraph ?? null;
  const local = serper?.localResults?.[0] ?? null;
  const organic0 = serper?.organic?.[0] ?? null;

  const website: string | null = kg?.website ?? local?.website ?? organic0?.link ?? null;

  const socialLinks: Record<string, string | null> = {
    instagram: null, linkedin: null, facebook: null, youtube: null, twitter: null,
  };
  for (const profile of (kg?.profiles ?? [])) {
    const url = profile?.link;
    if (!url) continue;
    if (url.includes('instagram.com')) socialLinks.instagram = url;
    else if (url.includes('linkedin.com')) socialLinks.linkedin = url;
    else if (url.includes('facebook.com')) socialLinks.facebook = url;
    else if (url.includes('youtube.com')) socialLinks.youtube = url;
    else if (url.includes('twitter.com') || url.includes('x.com')) socialLinks.twitter = url;
  }

  const attrs: Partial<Record<string, string>> = kg?.attributes ?? {};
  const foundedRaw = attrs['Founded'] ?? attrs['Year Founded'] ?? null;
  const hqRaw = attrs['Headquarters'] ?? attrs['Location'] ?? null;

  // Promoter / founder from KG attributes (many real estate KGs have these)
  const promoterRaw =
    attrs['Founder'] ?? attrs['Founders'] ?? attrs['Co-founder'] ??
    attrs['Promoter'] ?? attrs['Chairman'] ?? attrs['Managing Director'] ??
    attrs['CEO'] ?? attrs['CMD'] ?? null;

  return {
    website,
    industry: kg?.type ?? null,
    foundedYear: foundedRaw ? String(foundedRaw).replace(/[^0-9]/g, '').slice(0, 4) || null : null,
    headquarters: hqRaw ?? local?.address ?? null,
    phone: local?.phone ?? null,
    description: kg?.description ?? null,
    promoterName: promoterRaw ?? null,
    socialLinks,
  };
}

async function fetchWikipediaSummary(brandName: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(brandName.replace(/\s+/g, '_'));
    const res = await fetchWithRetry(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { headers: { 'Accept': 'application/json' } },
      1, 8000
    );
    if (!res.ok) return null;
    const data = await res.json() as { type?: string; extract?: string };
    if (data.type === 'disambiguation' || !data.extract) return null;
    return data.extract ?? null;
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

    // Run Serper web search + Places search + founder search in parallel
    const [serpRaw, placesRaw, founderSerpRaw] = await Promise.all([
      getSerpResults(`${brandName} official website`).catch(() => null),
      getPlacesResults(`${brandName}`).catch(() => null),
      getSerpResults(`${brandName} founder promoter chairman director`).catch(() => null),
    ]);

    const serperData: SerperExtracted = serpRaw
      ? extractFromSerper(serpRaw as SerperResult)
      : { website: null, industry: null, foundedYear: null, headquarters: null, phone: null, description: null, promoterName: null, socialLinks: { instagram: null, linkedin: null, facebook: null, youtube: null, twitter: null } };

    // Extract address + phone from Places if not found in web search
    const placesData = placesRaw as PlacesResult | null;
    const firstPlace = placesData?.places?.[0] ?? null;
    const address = serperData.headquarters ?? firstPlace?.address ?? null;
    const phone = serperData.phone ?? firstPlace?.phone ?? null;
    const websiteFromPlaces = firstPlace?.website ?? null;

    // Resolve website + domain
    const resolvedWebsite = providedDomain
      ? (providedDomain.startsWith('http') ? providedDomain : `https://${providedDomain}`)
      : (serperData.website ?? websiteFromPlaces);
    const domain = providedDomain
      ? extractDomain(providedDomain)
      : extractDomain(serperData.website ?? websiteFromPlaces);

    // Run all enrichment in parallel
    const needsInstagram = !serperData.socialLinks.instagram;
    const needsLinkedin = !serperData.socialLinks.linkedin;
    const needsFacebook = !serperData.socialLinks.facebook;
    const needsYoutube = !serperData.socialLinks.youtube;

    const [
      scrapedLinks,
      wikiSummary,
      logoUrl,
      instagramSearch,
      linkedinSearch,
      facebookSearch,
      youtubeSearch,
    ] = await Promise.all([
      resolvedWebsite ? scrapeSocialLinks(resolvedWebsite).catch(() => null) : Promise.resolve(null),
      fetchWikipediaSummary(brandName).catch(() => null),
      domain ? checkClearbitLogo(domain).catch(() => null) : Promise.resolve(null),
      needsInstagram ? getSocialProfileUrl(brandName, 'instagram.com').catch(() => null) : Promise.resolve(null),
      needsLinkedin ? getSocialProfileUrl(brandName, 'linkedin.com/company').catch(() => null) : Promise.resolve(null),
      needsFacebook ? getSocialProfileUrl(brandName, 'facebook.com').catch(() => null) : Promise.resolve(null),
      needsYoutube ? getSocialProfileUrl(brandName, 'youtube.com').catch(() => null) : Promise.resolve(null),
    ]);

    // Merge: KG profiles > homepage scrape > targeted search
    const mergedSocials = {
      instagram: serperData.socialLinks.instagram ?? scrapedLinks?.instagram ?? instagramSearch ?? null,
      linkedin: serperData.socialLinks.linkedin ?? scrapedLinks?.linkedin ?? linkedinSearch ?? null,
      facebook: serperData.socialLinks.facebook ?? scrapedLinks?.facebook ?? facebookSearch ?? null,
      youtube: serperData.socialLinks.youtube ?? scrapedLinks?.youtube ?? youtubeSearch ?? null,
      twitter: serperData.socialLinks.twitter ?? scrapedLinks?.twitter ?? null,
      whatsapp: scrapedLinks?.whatsapp ?? null,
    };

    // Promoter/founder: KG attrs first, then Groq extraction from search snippets
    let promoterName: string | null = serperData.promoterName;
    if (!promoterName) {
      const founderSerpData = founderSerpRaw as SerperResult | null;
      const founderContext = [
        founderSerpData?.knowledgeGraph?.description,
        ...(founderSerpData?.organic ?? []).slice(0, 4).map((r: Record<string, unknown>) => r.snippet as string ?? ''),
        wikiSummary,
      ].filter(Boolean).join('\n');

      if (founderContext.trim()) {
        promoterName = await extractFieldFromText(
          `founder or promoter or managing director of ${brandName} (a real estate developer)`,
          founderContext,
          'Rajiv Singhania',
        ).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        website: resolvedWebsite,
        resolvedDomain: domain,
        industry: serperData.industry,
        foundedYear: serperData.foundedYear,
        address,
        phone,
        promoterName,
        description: wikiSummary ?? serperData.description,
        logoUrl,
        socials: {
          instagramUrl: mergedSocials.instagram,
          instagramHandle: extractInstagramHandle(mergedSocials.instagram),
          linkedinUrl: mergedSocials.linkedin,
          facebookUrl: mergedSocials.facebook,
          youtubeUrl: mergedSocials.youtube,
          twitterUrl: mergedSocials.twitter,
          whatsappNumber: mergedSocials.whatsapp,
        },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Prefill lookup failed';
    console.error('[prefill] error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

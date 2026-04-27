import { NextRequest, NextResponse } from 'next/server';
import { autocompletePlace } from '@/lib/apis/googlePlaces';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await autocompletePlace(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Developer search error:', error);
    return NextResponse.json({ results: [] });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getUserByUsername, getUserPosts, calculateInstagramMetrics } from '@/lib/apis/hikerApi';

export async function POST(request: NextRequest) {
  try {
    const { instagramHandle, auditId } = await request.json();
    if (!instagramHandle) {
      return NextResponse.json({ success: false, data: null, error: 'instagramHandle required' });
    }

    const handle = instagramHandle.replace('@', '');
    let user = null;
    try {
      user = await getUserByUsername(handle);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Instagram user lookup error:', msg);
      return NextResponse.json({ success: false, data: null, error: msg });
    }

    if (!user) {
      return NextResponse.json({ success: false, data: null, error: 'Instagram user not found' });
    }

    const userId = (user as { pk?: string; id?: string }).pk || (user as { pk?: string; id?: string }).id;
    if (!userId) {
      return NextResponse.json({ success: false, data: null, error: 'Could not get Instagram user ID' });
    }

    let posts: Awaited<ReturnType<typeof getUserPosts>> = [];
    try {
      posts = await getUserPosts(userId);
    } catch (err) {
      console.error('Instagram posts fetch error:', err instanceof Error ? err.message : err);
      // Continue with empty posts — partial data is better than none
    }

    const metrics = calculateInstagramMetrics(user, posts);
    const data = { user, posts: posts.slice(0, 12), metrics };

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.instagramData': data });
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to collect Instagram data';
    console.error('Instagram collection error:', msg);
    return NextResponse.json({ success: false, data: null, error: msg });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import { getUserByUsername, getUserPosts, calculateInstagramMetrics } from '@/lib/apis/hikerApi';

export async function POST(request: NextRequest) {
  try {
    const { instagramHandle, auditId } = await request.json();
    if (!instagramHandle) return NextResponse.json({ error: 'instagramHandle required' }, { status: 400 });

    const handle = instagramHandle.replace('@', '');
    const user = await getUserByUsername(handle);
    if (!user) return NextResponse.json({ error: 'Instagram user not found' }, { status: 404 });

    const userId = (user as { pk?: string; id?: string }).pk || (user as { pk?: string; id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Could not get user ID' }, { status: 500 });

    const posts = await getUserPosts(userId);
    const metrics = calculateInstagramMetrics(user, posts);
    const data = { user, posts: posts.slice(0, 12), metrics };

    if (auditId) {
      await connectDB();
      await Audit.findByIdAndUpdate(auditId, { 'collectedData.instagramData': data });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Instagram collection error:', error);
    return NextResponse.json({ error: 'Failed to collect Instagram data' }, { status: 500 });
  }
}

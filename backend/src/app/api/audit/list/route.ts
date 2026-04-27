import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();
    const audits = await Audit.find().sort({ createdAt: -1 }).limit(50).lean();
    const withDevelopers = await Promise.all(
      audits.map(async (audit) => {
        const developer = await Developer.findById(audit.developerId).lean();
        return { ...audit, developer };
      })
    );
    return NextResponse.json(withDevelopers);
  } catch (error) {
    console.error('List audits error:', error);
    return NextResponse.json({ error: 'Failed to list audits' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export async function GET(_req: NextRequest, { params }: { params: { auditId: string } }) {
  try {
    await connectDB();
    const audit = await Audit.findById(params.auditId).lean();
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    const developer = await Developer.findById(audit.developerId).lean();
    return NextResponse.json({ ...audit, developer });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { auditId: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    const audit = await Audit.findByIdAndUpdate(params.auditId, body, { new: true }).lean();
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    const developer = await Developer.findById(audit.developerId).lean();
    return NextResponse.json({ ...audit, developer });
  } catch (error) {
    console.error('Update audit error:', error);
    return NextResponse.json({ error: 'Failed to update audit' }, { status: 500 });
  }
}

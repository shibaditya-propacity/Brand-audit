import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    const { auditId } = params;
    const body = await request.json();
    const { dimensionCode, data } = body as { dimensionCode: string; data: Record<string, unknown> };

    if (!dimensionCode || !data) {
      return NextResponse.json({ success: false, error: 'dimensionCode and data are required' }, { status: 400 });
    }

    await connectDB();
    const audit = await Audit.findById(auditId);
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    // Merge new data into existing manual overrides for this dimension
    const existing = (audit.manualOverrides as Record<string, unknown>) ?? {};
    const updated = { ...existing, [dimensionCode]: { ...(existing[dimensionCode] as Record<string, unknown> ?? {}), ...data } };

    audit.set('manualOverrides', updated);
    await audit.save();

    return NextResponse.json({ success: true, manualOverrides: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save manual input';
    console.error('Manual input error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

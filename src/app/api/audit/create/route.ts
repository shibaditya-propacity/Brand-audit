import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Developer, Audit } from '@/lib/models';
import { z } from 'zod';

const DeveloperSchema = z.object({
  brandName: z.string().min(1),
  legalName: z.string().optional(),
  domain: z.string().optional(),
  city: z.string().optional(),
  yearEstablished: z.number().optional(),
  positioning: z.string().optional(),
  productType: z.string().optional(),
  microMarkets: z.array(z.string()).default([]),
  targetSegments: z.array(z.string()).default([]),
  promoterName: z.string().optional(),
  promoterLinkedIn: z.string().optional(),
  websiteUrl: z.string().optional(),
  instagramHandle: z.string().optional(),
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  whatsappNumber: z.string().optional(),
  gmbPlaceId: z.string().optional(),
  acres99Url: z.string().optional(),
  housingUrl: z.string().optional(),
  magicbricksUrl: z.string().optional(),
  reraNumbers: z.array(z.string()).default([]),
  reraState: z.string().optional(),
  adSpendRange: z.string().optional(),
  adPlatforms: z.array(z.string()).default([]),
  crmTool: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  metaAdLibraryName: z.string().optional(),
  collateralDocs: z.array(z.object({
    name: z.string(),
    textContent: z.string(),
  })).default([]),
});

const CreateAuditSchema = z.object({
  developer: DeveloperSchema,
  auditorName: z.string().optional(),
  objective: z.string().optional(),
  knownRedFlags: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { developer: devData, auditorName, objective, knownRedFlags } = CreateAuditSchema.parse(body);

    // ── Check for an existing COMPLETE audit for the same brand ──────────────
    // Match on brandName (case-insensitive) or domain (if provided).
    // This avoids re-running expensive LLM analysis for the same company.
    const nameFilter = { brandName: { $regex: `^${devData.brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
    const domainFilter = devData.domain ? { domain: devData.domain.toLowerCase() } : null;
    const existingDev = await Developer.findOne(
      domainFilter ? { $or: [nameFilter, domainFilter] } : nameFilter
    ).lean() as { _id: unknown } | null;

    if (existingDev) {
      const existingAudit = await Audit.findOne({
        developerId: existingDev._id,
        status: 'COMPLETE',
      })
        .sort({ createdAt: -1 })
        .lean();

      if (existingAudit) {
        const developer = await Developer.findById(existingDev._id).lean();
        return NextResponse.json(
          { ...existingAudit, developer, existing: true },
          { status: 200 },
        );
      }
    }
    // ── No existing audit — create fresh ─────────────────────────────────────

    const developer = await Developer.create(devData);

    const audit = await Audit.create({
      developerId: developer._id,
      auditorName,
      objective,
      knownRedFlags,
      status: 'DRAFT',
      dimensions: [],
      assets: [],
    });

    const populated = await Audit.findById(audit._id).populate('developerId').lean();
    return NextResponse.json({ ...populated, developer }, { status: 201 });
  } catch (error) {
    console.error('Create audit error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create audit', detail: message }, { status: 500 });
  }
}

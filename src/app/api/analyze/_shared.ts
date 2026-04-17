import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import type { IAudit } from '@/lib/models/Audit';

export async function getAuditWithDev(auditId: string) {
  await connectDB();
  const Mongoose = await import('@/lib/models');
  const audit = await Mongoose.Audit.findById(auditId).lean() as (IAudit & { _id: unknown }) | null;
  if (!audit) return { audit: null, dev: null };
  const dev = await Mongoose.Developer.findById(audit.developerId).lean();
  return { audit, dev };
}

type ItemStatus = 'PASS' | 'FAIL' | 'PARTIAL';
const STATUS_MAP: Record<string, ItemStatus> = { pass: 'PASS', fail: 'FAIL', partial: 'PARTIAL' };

export async function saveDimensionResult(
  auditId: string,
  code: string,
  findings: {
    score: number;
    summary: string;
    items: Array<{ code: string; status: string; finding: string; recommendation: string; priority: string; dataSource: string }>;
    criticalFlags: string[];
    strengths: string[];
    quickWins: string[];
    [key: string]: unknown;
  }
) {
  await connectDB();

  const items = (findings.items || []).map((item) => ({
    itemCode: item.code,
    status: STATUS_MAP[item.status] || 'FAIL',
    aiNote: item.finding,
    dataSource: item.dataSource,
  }));

  const dimensionData = {
    code,
    score: findings.score,
    status: 'complete',
    aiSummary: findings.summary,
    aiFindings: findings as Record<string, unknown>,
    aiFlags: findings.criticalFlags || [],
    items,
    analyzedAt: new Date(),
  };

  // Check if dimension already exists
  const audit = await Audit.findById(auditId);
  if (!audit) throw new Error('Audit not found');

  const existingIdx = audit.dimensions.findIndex((d: { code: string }) => d.code === code);
  if (existingIdx >= 0) {
    const existing = audit.dimensions[existingIdx];
    audit.dimensions[existingIdx] = {
      ...(typeof existing.toObject === 'function' ? existing.toObject() : existing),
      ...dimensionData,
    };
  } else {
    audit.dimensions.push(dimensionData as Parameters<typeof audit.dimensions.push>[0]);
  }

  await audit.save();
  return findings.score;
}

import connectDB from '@/lib/mongodb';
import { Audit } from '@/lib/models';
import type { IAudit } from '@/lib/models/Audit';

export async function getAuditWithDev(auditId: string) {
  await connectDB();
  const Mongoose = await import('@/lib/models');
  const audit = await Mongoose.Audit.findById(auditId).lean() as (IAudit & { _id: unknown }) | null;
  if (!audit) return { audit: null, dev: null, manualOverrides: {} };
  const dev = await Mongoose.Developer.findById(audit.developerId).lean();
  const manualOverrides = (audit.manualOverrides as Record<string, unknown>) ?? {};
  return { audit, dev, manualOverrides };
}

type ItemStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'NA';
const STATUS_MAP: Record<string, ItemStatus> = {
  pass: 'PASS',
  fail: 'FAIL',
  partial: 'PARTIAL',
  na: 'NA',
};

/**
 * Build a manual override note to append to Claude prompts.
 * Provides auditor-supplied data that supplements or corrects auto-collected data.
 */
export function buildManualOverrideNote(overrides: unknown): string {
  if (!overrides || typeof overrides !== 'object' || Object.keys(overrides).length === 0) return '';
  const lines = Object.entries(overrides as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`);
  if (!lines.length) return '';
  return (
    '\n\nMANUAL AUDITOR INPUT: The following data was manually provided by the auditor and should be ' +
    'treated as ground truth, taking precedence over inferred or auto-collected data where applicable:\n' +
    lines.join('\n')
  );
}

/**
 * Build a data availability note to append to Claude prompts.
 * Tells Claude which sources are missing so it can mark items NA instead of failing.
 */
export function buildDataAvailabilityNote(missing: string[]): string {
  if (!missing.length) return '';
  return (
    '\n\nDATA AVAILABILITY NOTE: The following data sources are unavailable for this audit: ' +
    missing.join(', ') +
    '. STRICT RULES: (1) Set status to "na" and finding to "Data source unavailable — cannot evaluate"' +
    ' for every checklist item that depends on these sources.' +
    ' (2) Do NOT use "partial" as a substitute for missing data.' +
    ' (3) Do NOT write observations like "the existence of X suggests Y" when you cannot see actual data.' +
    ' (4) Do NOT infer, assume, or speculate about data you were not given.'
  );
}

/**
 * Call this when ALL required data sources for a dimension are unavailable.
 * Saves the dimension as no_data (null score) without calling any LLM.
 */
export async function saveSkippedDimension(auditId: string, code: string) {
  await connectDB();
  const dimensionData = {
    code,
    score: null,
    status: 'no_data',
    aiSummary: 'No data sources were available — analysis skipped.',
    aiFindings: { insufficientData: true, skipped: true },
    aiFlags: [],
    items: [],
    analyzedAt: new Date(),
  };

  const audit = await Audit.findById(auditId);
  if (!audit) throw new Error('Audit not found');

  const existingIdx = audit.dimensions.findIndex((d: { code: string }) => d.code === code);
  if (existingIdx >= 0) {
    const existing = audit.dimensions[existingIdx];
    const existingObj = (typeof (existing as unknown as { toObject?: () => object }).toObject === 'function'
      ? (existing as unknown as { toObject: () => object }).toObject()
      : existing) as object;
    audit.dimensions[existingIdx] = { ...existingObj, ...dimensionData } as unknown as typeof existing;
  } else {
    audit.dimensions.push(dimensionData as unknown as Parameters<typeof audit.dimensions.push>[0]);
  }

  await audit.save();
  return null;
}

export async function saveDimensionResult(
  auditId: string,
  code: string,
  findings: {
    score: number;
    summary: string;
    items: Array<{ code: string; status: string; finding: string; recommendation: string; priority: string; dataSource: string; sourceUrl?: string }>;
    criticalFlags: string[];
    strengths: string[];
    quickWins: string[];
    [key: string]: unknown;
  }
) {
  await connectDB();

  const items = (findings.items || []).map((item) => ({
    itemCode: item.code,
    status: STATUS_MAP[item.status?.toLowerCase?.()] ?? 'FAIL',
    aiNote: item.finding,
    dataSource: item.dataSource,
    sourceUrl: item.sourceUrl ?? null,
  }));

  // If >50% of items are NA, treat score as null (insufficient data)
  const naCount = items.filter(i => i.status === 'NA').length;
  const insufficientData = items.length > 0 && naCount / items.length > 0.5;
  const score = insufficientData ? null : findings.score;

  const dimensionData = {
    code,
    score,
    status: insufficientData ? 'insufficient_data' : 'complete',
    aiSummary: findings.summary,
    aiFindings: { ...findings as Record<string, unknown>, insufficientData },
    aiFlags: findings.criticalFlags || [],
    items,
    analyzedAt: new Date(),
  };

  const audit = await Audit.findById(auditId);
  if (!audit) throw new Error('Audit not found');

  const existingIdx = audit.dimensions.findIndex((d: { code: string }) => d.code === code);
  if (existingIdx >= 0) {
    const existing = audit.dimensions[existingIdx];
    const existingObj = (typeof (existing as unknown as { toObject?: () => object }).toObject === 'function'
      ? (existing as unknown as { toObject: () => object }).toObject()
      : existing) as object;
    audit.dimensions[existingIdx] = { ...existingObj, ...dimensionData } as unknown as typeof existing;
  } else {
    audit.dimensions.push(dimensionData as unknown as Parameters<typeof audit.dimensions.push>[0]);
  }

  await audit.save();
  // Return null when insufficient data so it is excluded from overall score
  return score;
}

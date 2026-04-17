import type { ItemStatus } from '@/types/audit';
import type { ItemType, DimensionCode } from '@/types/checklist';
import type { ChecklistItemResult } from '@/types/audit';
import { DIMENSION_WEIGHTS } from './dimensions';

export function getItemScore(status: ItemStatus | null, type: ItemType): number {
  if (!status) return 0;
  switch (status) {
    case 'PASS': return 1;
    case 'PARTIAL': return type === 'PASS_FAIL' ? 0 : 0.5;
    case 'FAIL': return 0;
    case 'NA': return 1; // NA items don't penalize
    default: return 0;
  }
}

export function calculateDimensionScore(items: ChecklistItemResult[], itemTypes: Record<string, ItemType>): number {
  if (!items.length) return 0;
  const scoredItems = items.filter(item => item.status !== 'NA');
  if (!scoredItems.length) return 0;
  const totalScore = scoredItems.reduce((sum, item) => {
    const type = itemTypes[item.itemCode] || 'VERIFIABLE';
    return sum + getItemScore(item.status, type);
  }, 0);
  return Math.round((totalScore / scoredItems.length) * 100);
}

export function calculateOverallScore(dimensionScores: Partial<Record<DimensionCode, number>>): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [code, score] of Object.entries(dimensionScores) as [DimensionCode, number][]) {
    const weight = DIMENSION_WEIGHTS[code];
    if (weight && score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }
  if (!totalWeight) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function getScoreColor(score: number): string {
  if (score <= 40) return 'text-red-600';
  if (score <= 60) return 'text-amber-500';
  if (score <= 75) return 'text-yellow-600';
  if (score <= 90) return 'text-green-600';
  return 'text-emerald-700';
}

export function getScoreBgColor(score: number): string {
  if (score <= 40) return 'bg-red-100';
  if (score <= 60) return 'bg-amber-100';
  if (score <= 75) return 'bg-yellow-100';
  if (score <= 90) return 'bg-green-100';
  return 'bg-emerald-100';
}

export function getScoreLabel(score: number): string {
  if (score <= 40) return 'Needs Significant Work';
  if (score <= 60) return 'Developing';
  if (score <= 75) return 'Established';
  if (score <= 90) return 'Strong';
  return 'Best-in-Class';
}

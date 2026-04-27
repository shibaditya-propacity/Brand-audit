import type { DimensionCode } from '@/types/checklist';

export interface DimensionMeta {
  code: DimensionCode;
  name: string;
  shortName: string;
  weight: number;
  description: string;
  icon: string;
  color: string;
}

export const DIMENSIONS: DimensionMeta[] = [
  { code: 'D1', name: 'Brand Overview', shortName: 'Brand', weight: 8, description: 'Fundamental brand identity, positioning, and market presence', icon: 'Building2', color: '#6366f1' },
  { code: 'D2', name: 'Website & SEO', shortName: 'Website', weight: 12, description: 'Website quality, content, and search engine performance', icon: 'Globe', color: '#0ea5e9' },
  { code: 'D3', name: 'Social Media', shortName: 'Social', weight: 10, description: 'Social media presence, engagement, and content strategy', icon: 'Share2', color: '#ec4899' },
  { code: 'D4', name: 'Paid Media', shortName: 'Ads', weight: 12, description: 'Paid advertising strategy, creative quality, and budget signals', icon: 'Megaphone', color: '#f59e0b' },
  { code: 'D5', name: 'Visual Identity', shortName: 'Visual', weight: 8, description: 'Logo, color palette, typography, and design consistency', icon: 'Palette', color: '#8b5cf6' },
  { code: 'D6', name: 'Collateral', shortName: 'Collateral', weight: 8, description: 'Sales materials, brochures, site experience, and press kit', icon: 'FileText', color: '#14b8a6' },
  { code: 'D7', name: 'Reputation & Compliance', shortName: 'Reputation', weight: 15, description: 'Google reviews, RERA compliance, and legal standing', icon: 'ShieldCheck', color: '#22c55e' },
  { code: 'D8', name: 'Technology', shortName: 'Tech', weight: 10, description: 'CRM, analytics, martech stack, and digital infrastructure', icon: 'Cpu', color: '#f97316' },
  { code: 'D9', name: 'Competitors', shortName: 'Competitive', weight: 9, description: 'Competitive positioning, differentiation, and market intelligence', icon: 'BarChart3', color: '#ef4444' },
  { code: 'D10', name: 'Promoter Brand', shortName: 'Promoter', weight: 8, description: 'Promoter personal brand, credibility, and thought leadership', icon: 'User', color: '#a855f7' },
];

export function getDimensionByCode(code: DimensionCode): DimensionMeta | undefined {
  return DIMENSIONS.find(d => d.code === code);
}

export const DIMENSION_WEIGHTS: Record<DimensionCode, number> = Object.fromEntries(
  DIMENSIONS.map(d => [d.code, d.weight])
) as Record<DimensionCode, number>;

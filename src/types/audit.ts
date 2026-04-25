export type AuditStatus = 'DRAFT' | 'COLLECTING' | 'ANALYZING' | 'COMPLETE' | 'FAILED';
export type ItemStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'NA';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ScoreTier = 'needs-work' | 'developing' | 'established' | 'strong' | 'best-in-class';

export interface DeveloperInput {
  brandName: string;
  legalName?: string;
  domain?: string;
  city?: string;
  yearEstablished?: number;
  positioning?: string;
  productType?: string;
  microMarkets: string[];
  targetSegments: string[];
  promoterName?: string;
  promoterLinkedIn?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
  gmbPlaceId?: string;
  acres99Url?: string;
  housingUrl?: string;
  magicbricksUrl?: string;
  reraNumbers: string[];
  reraState?: string;
  adSpendRange?: string;
  adPlatforms: string[];
  crmTool?: string;
  competitors: string[];
  metaAdLibraryName?: string;
  collateralDocs?: Array<{ name: string; textContent: string }>;
}

export interface AuditDimensionResult {
  _id?: string;
  id?: string;
  code: string;
  score: number | null;
  status: string;
  aiSummary: string | null;
  aiFindings: AIDimensionFindings | Record<string, unknown> | null;
  aiFlags: string[] | null;
  analyzedAt: string | null;
  items: ChecklistItemResult[];
}

export interface ChecklistItemResult {
  _id?: string;
  id?: string;
  itemCode: string;
  status: ItemStatus | null;
  auditorNote: string | null;
  evidenceUrl: string | null;
  aiNote: string | null;
  dataSource: string | null;
}

export interface AIDimensionFindings {
  score: number;
  summary: string;
  items: AIItemResult[];
  criticalFlags: string[];
  strengths: string[];
  quickWins: string[];
}

export interface AIItemResult {
  code: string;
  status: 'pass' | 'fail' | 'partial';
  finding: string;
  recommendation: string;
  priority: Priority;
  dataSource: string;
}

export interface AuditWithRelations {
  _id: string;
  id?: string;
  developerId: string;
  developer: DeveloperInput & { _id?: string; id?: string };
  auditorName: string | null;
  auditDate: string;
  objective: string | null;
  knownRedFlags: string | null;
  overallScore: number | null;
  status: AuditStatus;
  collectedData: CollectedDataRecord | null;
  dataSourceStatus?: { collected: string[]; failed: string[] };
  dimensions: AuditDimensionResult[];
  assets: AuditAsset[];
  manualOverrides?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscoveredCompetitor {
  name: string;
  link: string;
  domain: string;
  snippet?: string;
  address?: string;
  rating?: number;
  source: 'organic' | 'places';
}

export interface CollateralAnalysisResult {
  summary: string;
  keyFindings: string[];
  marketPositioning: string;
  score: number;
  gaps: string[];
  recommendations: string[];
  docsAnalyzed: number;
  analyzedAt: string;
}

export interface CollectedDataRecord {
  gmbData: unknown;
  seoKeywords: unknown;
  technicalSeo: unknown;
  backlinks: unknown;
  googleReviews: unknown;
  websiteContent: unknown;
  instagramData: unknown;
  metaAdsData: unknown;
  screenshotUrl: string | null;
  logoUrl: string | null;
  collectedAt?: string;
  collateralAnalysis?: CollateralAnalysisResult;
  competitorData?: {
    competitors: DiscoveredCompetitor[];
    keywords: string[];
    collectedAt: string;
  };
}

export interface AuditAsset {
  _id?: string;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  aiAnalysis: unknown;
  uploadedAt: string;
}

export interface ProgressEvent {
  stage: 'collecting' | 'analyzing' | 'complete' | 'error';
  source?: string;
  dimension?: string;
  status?: 'in_progress' | 'done' | 'failed';
  overallScore?: number | null;
  score?: number | null;
  message?: string;
  collectedSources?: string[];
  failedSources?: string[];
}

export function getScoreTier(score: number): ScoreTier {
  if (score <= 40) return 'needs-work';
  if (score <= 60) return 'developing';
  if (score <= 75) return 'established';
  if (score <= 90) return 'strong';
  return 'best-in-class';
}

export function getScoreTierLabel(tier: ScoreTier): string {
  const labels: Record<ScoreTier, string> = {
    'needs-work': 'Needs Significant Work',
    'developing': 'Developing',
    'established': 'Established',
    'strong': 'Strong',
    'best-in-class': 'Best-in-Class',
  };
  return labels[tier];
}

export function getScoreTierColor(tier: ScoreTier): string {
  const colors: Record<ScoreTier, string> = {
    'needs-work': 'text-red-600',
    'developing': 'text-amber-500',
    'established': 'text-yellow-600',
    'strong': 'text-green-600',
    'best-in-class': 'text-emerald-700',
  };
  return colors[tier];
}

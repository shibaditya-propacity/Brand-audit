export interface AILogoAnalysis {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  positioningScore: number;
  modernityScore: number;
  versatilityScore: number;
  colorScore: number;
  typographyScore: number;
  strengths: string[];
  issues: string[];
  recommendations: string[];
}

export interface AIReputationFindings {
  score: number;
  summary: string;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  positiveThemes: string[];
  negativeThemes: string[];
  riskFlags: string[];
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
  priority: 'critical' | 'high' | 'medium' | 'low';
  dataSource: string;
  sourceUrl?: string;
}

export interface AIDimensionOutput {
  score: number;
  summary: string;
  items: AIItemResult[];
  criticalFlags: string[];
  strengths: string[];
  quickWins: string[];
}

export interface AIVisualIdentityOutput extends AIDimensionOutput {
  logoGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  visualConsistencyScore: number;
}

export interface AIInstagramAnalysis extends AIDimensionOutput {
  engagementTier: 'excellent' | 'good' | 'average' | 'poor';
  contentQualityScore: number;
  brandConsistencyScore: number;
}

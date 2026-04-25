import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AuditStatus = 'DRAFT' | 'COLLECTING' | 'ANALYZING' | 'COMPLETE' | 'FAILED';
export type ItemStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'NA';

// ── ChecklistItemResult (subdocument) ──────────────────────────
export interface IChecklistItemResult {
  _id: Types.ObjectId;
  itemCode: string;
  status?: ItemStatus;
  auditorNote?: string;
  evidenceUrl?: string;
  aiNote?: string;
  dataSource?: string;
  sourceUrl?: string;
}

const ChecklistItemResultSchema = new Schema<IChecklistItemResult>({
  itemCode: { type: String, required: true },
  status: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL', 'NA'] },
  auditorNote: String,
  evidenceUrl: String,
  aiNote: String,
  dataSource: String,
  sourceUrl: String,
});

// ── AuditDimension (subdocument) ───────────────────────────────
export interface IAuditDimension {
  _id: Types.ObjectId;
  code: string;
  score?: number;
  status: string;
  aiSummary?: string;
  aiFindings?: Record<string, unknown>;
  aiFlags?: string[];
  items: IChecklistItemResult[];
  analyzedAt?: Date;
}

const AuditDimensionSchema = new Schema<IAuditDimension>({
  code: { type: String, required: true },
  score: Number,
  status: { type: String, default: 'pending' },
  aiSummary: String,
  aiFindings: { type: Schema.Types.Mixed },
  aiFlags: [String],
  items: [ChecklistItemResultSchema],
  analyzedAt: Date,
});

// ── CollectedData (subdocument) ────────────────────────────────
export interface ICollectedData {
  gmbData?: Record<string, unknown>;
  seoKeywords?: Record<string, unknown>;
  technicalSeo?: Record<string, unknown>;
  backlinks?: Record<string, unknown>;
  googleReviews?: Record<string, unknown>;
  websiteContent?: Record<string, unknown>;
  instagramData?: Record<string, unknown>;
  facebookData?: Record<string, unknown>;
  linkedinData?: Record<string, unknown>;
  metaAdsData?: Record<string, unknown>;
  promoterLinkedInData?: Record<string, unknown>;
  screenshotUrl?: string;
  logoUrl?: string;
  collectedAt: Date;
  competitorData?: {
    competitors: Array<{
      name: string;
      link: string;
      domain: string;
      snippet?: string;
      address?: string;
      rating?: number;
      source: 'organic' | 'places';
    }>;
    keywords: string[];
    collectedAt: string;
  };
}

const CollectedDataSchema = new Schema<ICollectedData>({
  gmbData: { type: Schema.Types.Mixed },
  seoKeywords: { type: Schema.Types.Mixed },
  technicalSeo: { type: Schema.Types.Mixed },
  backlinks: { type: Schema.Types.Mixed },
  googleReviews: { type: Schema.Types.Mixed },
  websiteContent: { type: Schema.Types.Mixed },
  instagramData: { type: Schema.Types.Mixed },
  facebookData: { type: Schema.Types.Mixed },
  linkedinData: { type: Schema.Types.Mixed },
  metaAdsData: { type: Schema.Types.Mixed },
  promoterLinkedInData: { type: Schema.Types.Mixed },
  screenshotUrl: String,
  logoUrl: String,
  collectedAt: { type: Date, default: Date.now },
  competitorData: { type: Schema.Types.Mixed },
});

// ── AuditAsset (subdocument) ───────────────────────────────────
export interface IAuditAsset {
  _id: Types.ObjectId;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  aiAnalysis?: Record<string, unknown>;
  uploadedAt: Date;
}

const AuditAssetSchema = new Schema<IAuditAsset>({
  type: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  mimeType: String,
  aiAnalysis: { type: Schema.Types.Mixed },
  uploadedAt: { type: Date, default: Date.now },
});

// ── Audit (main document) ──────────────────────────────────────
export interface IAudit extends Document {
  developerId: Types.ObjectId;
  auditorName?: string;
  auditDate: Date;
  objective?: string;
  knownRedFlags?: string;
  overallScore?: number;
  status: AuditStatus;
  collectedData?: ICollectedData;
  dataSourceStatus?: { collected: string[]; failed: string[] };
  dimensions: IAuditDimension[];
  assets: IAuditAsset[];
  manualOverrides?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    developerId: { type: Schema.Types.ObjectId, ref: 'Developer', required: true },
    auditorName: String,
    auditDate: { type: Date, default: Date.now },
    objective: String,
    knownRedFlags: String,
    overallScore: Number,
    status: {
      type: String,
      enum: ['DRAFT', 'COLLECTING', 'ANALYZING', 'COMPLETE', 'FAILED'],
      default: 'DRAFT',
    },
    collectedData: CollectedDataSchema,
    dataSourceStatus: {
      collected: [String],
      failed: [String],
    },
    dimensions: [AuditDimensionSchema],
    assets: [AuditAssetSchema],
    manualOverrides: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Audit: Model<IAudit> =
  mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema);

export default Audit;

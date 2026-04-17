import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeveloper extends Document {
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
  pdlData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperSchema = new Schema<IDeveloper>(
  {
    brandName: { type: String, required: true },
    legalName: String,
    domain: String,
    city: String,
    yearEstablished: Number,
    positioning: String,
    productType: String,
    microMarkets: { type: [String], default: [] },
    targetSegments: { type: [String], default: [] },
    promoterName: String,
    promoterLinkedIn: String,
    websiteUrl: String,
    instagramHandle: String,
    facebookUrl: String,
    linkedinUrl: String,
    youtubeUrl: String,
    whatsappNumber: String,
    gmbPlaceId: String,
    acres99Url: String,
    housingUrl: String,
    magicbricksUrl: String,
    reraNumbers: { type: [String], default: [] },
    reraState: String,
    adSpendRange: String,
    adPlatforms: { type: [String], default: [] },
    crmTool: String,
    competitors: { type: [String], default: [] },
    metaAdLibraryName: String,
    pdlData: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Developer: Model<IDeveloper> =
  mongoose.models.Developer || mongoose.model<IDeveloper>('Developer', DeveloperSchema);

export default Developer;

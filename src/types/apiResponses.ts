export interface PDLCompanyResponse {
  id?: string;
  name?: string;
  domain?: string;
  website?: string;
  industry?: string;
  industries?: string[];
  description?: string;
  keywords?: string[];
  technologies?: string[];
  founded_year?: number;
  naics_codes?: string[];
  location?: {
    country?: {
      code?: string;
      name?: string;
      latitude?: number;
      longitude?: number;
    };
    state?: {
      id?: number;
      name?: string;
      code?: string;
      latitude?: number;
      longitude?: number;
    };
    city?: {
      id?: number;
      name?: string;
      latitude?: number;
      longitude?: number;
    };
    address?: string;
    postal_code?: string;
    phone?: string;
  };
  financial?: {
    stock_symbol?: string;
    stock_exchange?: string;
    total_funding?: number;
    funding_stage?: string;
    funding_date?: string;
  };
  socials?: {
    linkedin_url?: string;
    linkedin_id?: string;
    twitter_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    angellist_url?: string;
    crunchbase_url?: string;
    youtube_url?: string;
    github_url?: string;
    g2_url?: string;
  };
  workforce?: {
    observed_employee_count?: number;
    department_headcount?: Record<string, number>;
  };
  logo_url?: string;
  seo_description?: string;
  updated_at?: string;
}

export interface SerperSearchResult {
  organic?: SerperOrganicItem[];
  searchParameters?: { q: string; gl: string; hl: string; num: number };
  knowledgeGraph?: Record<string, unknown>;
  answerBox?: Record<string, unknown>;
  topStories?: Record<string, unknown>[];
}

export interface SerperOrganicItem {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

// kept for backlinks/on-page stubs that still reference these shapes
export interface DataForSEOBacklinksResponse {
  target: string;
  total_count?: number;
  referring_domains?: number;
  rank?: number;
  backlinks_spam_score?: number;
  referring_ips?: number;
}

export interface DataForSEOBacklinksResponse {
  target: string;
  total_count?: number;
  referring_domains?: number;
  rank?: number;
  backlinks_spam_score?: number;
  referring_ips?: number;
}

export interface DataForSEOOnPageResult {
  crawl_progress?: string;
  crawl_status?: { max_crawl_pages: number; pages_in_queue: number; pages_crawled: number };
  domain_info?: {
    name: string;
    cms?: string;
    ip?: string;
    ssl_info?: { valid_certificate: boolean; certificate_issuer?: string };
  };
  page_metrics?: {
    broken_links?: number;
    broken_resources?: number;
    duplicate_title?: number;
    duplicate_description?: number;
    duplicate_content?: number;
    no_title?: number;
    no_description?: number;
    no_h1?: number;
    title_too_long?: number;
    title_too_short?: number;
  };
}

export interface WebCrawlerResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  pages?: WebCrawlerPage[];
  total_pages?: number;
}

export interface WebCrawlerPage {
  url: string;
  title?: string;
  meta_description?: string;
  content?: string;
  headings?: { h1?: string[]; h2?: string[] };
  status_code?: number;
}

export interface ApifyInstagramProfile {
  pk?: string; // set to username for internal routing
  username: string;
  fullName?: string;
  biography?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isBusinessAccount?: boolean;
  isVerified?: boolean;
  profilePicUrl?: string;
  externalUrl?: string;
}

export interface ApifyInstagramPost {
  id: string;
  type: 'Image' | 'Video' | 'Sidecar';
  likesCount: number;
  commentsCount: number;
  caption?: string;
  timestamp: string; // ISO 8601
  displayUrl?: string;
  videoUrl?: string;
}

export interface MetaAdResponse {
  id: string;
  ad_creation_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_snapshot_url?: string;
  page_name?: string;
  impressions?: { lower_bound?: string; upper_bound?: string };
  spend?: { lower_bound?: string; upper_bound?: string; currency?: string };
  currency?: string;
}

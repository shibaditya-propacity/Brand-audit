export interface PDLCompanyResponse {
  status: number;
  name?: string;
  display_name?: string;
  size?: string;
  employee_count?: number;
  industry?: string;
  summary?: string;
  founded?: number;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  location?: {
    country?: string;
    region?: string;
    locality?: string;
  };
}

export interface DataForSEOSerpResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  items?: SerpItem[];
  items_count?: number;
  organic?: SerpItem[];
}

export interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  domain: string;
  title: string;
  description: string;
  url: string;
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

export interface HikerUserResponse {
  pk?: string;
  id?: string;
  username: string;
  full_name?: string;
  biography?: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_business_account?: boolean;
  is_verified?: boolean;
  profile_pic_url?: string;
  external_url?: string;
}

export interface HikerPostResponse {
  id: string;
  media_type: 1 | 2 | 8;
  like_count: number;
  comment_count: number;
  caption?: { text?: string };
  taken_at: number;
  thumbnail_url?: string;
  image_versions2?: { candidates?: Array<{ url: string }> };
  video_url?: string;
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

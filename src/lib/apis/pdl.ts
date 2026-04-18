import axios from 'axios';
import type { PDLCompanyResponse } from '@/types/apiResponses';

const CE_BASE_URL = 'https://api.companyenrich.com';

export async function enrichCompany(domain: string): Promise<PDLCompanyResponse | null> {
  try {
    const response = await axios.get(`${CE_BASE_URL}/companies/enrich`, {
      params: { domain },
      headers: {
        Authorization: `Bearer ${process.env.COMPANY_ENRICH_API_KEY}`,
        accept: 'application/json',
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function extractCompanyData(data: PDLCompanyResponse) {
  return {
    name: data.name,
    employeeCount: data.workforce?.observed_employee_count,
    size: undefined,
    industry: data.industry || (data.industries?.[0] ?? undefined),
    summary: data.description,
    founded: data.founded_year,
    location: data.location,
    socialLinks: {
      linkedin: data.socials?.linkedin_url,
      twitter: data.socials?.twitter_url,
      facebook: data.socials?.facebook_url,
      instagram: data.socials?.instagram_url,
      youtube: data.socials?.youtube_url,
    },
  };
}

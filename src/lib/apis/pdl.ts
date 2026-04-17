import axios from 'axios';
import type { PDLCompanyResponse } from '@/types/apiResponses';

const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

export async function enrichCompany(domain: string): Promise<PDLCompanyResponse | null> {
  try {
    const response = await axios.get(`${PDL_BASE_URL}/company/enrich`, {
      params: { website: domain, pretty: true },
      headers: { 'X-Api-Key': process.env.PDL_API_KEY },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function extractCompanyData(data: PDLCompanyResponse) {
  return {
    name: data.display_name || data.name,
    employeeCount: data.employee_count,
    size: data.size,
    industry: data.industry,
    summary: data.summary,
    founded: data.founded,
    location: data.location,
    socialLinks: {
      linkedin: data.linkedin_url,
      twitter: data.twitter_url,
      facebook: data.facebook_url,
      instagram: data.instagram_url,
      youtube: data.youtube_url,
    },
  };
}

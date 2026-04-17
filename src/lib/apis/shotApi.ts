import axios from 'axios';

export async function captureScreenshot(websiteUrl: string): Promise<string | null> {
  try {
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=${process.env.SHOT_API_KEY}&url=${encodeURIComponent(websiteUrl)}&output=image&file_type=png&width=1440&height=900&wait_for_event=load`;
    // Verify the URL is accessible
    const response = await axios.head(screenshotUrl);
    if (response.status === 200) return screenshotUrl;
    return null;
  } catch {
    return null;
  }
}

export function getClearbitLogoUrl(domain: string): string {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return `https://logo.clearbit.com/${cleanDomain}`;
}

export async function checkClearbitLogo(domain: string): Promise<string | null> {
  const logoUrl = getClearbitLogoUrl(domain);
  try {
    const response = await axios.head(logoUrl);
    return response.status === 200 ? logoUrl : null;
  } catch {
    return null;
  }
}

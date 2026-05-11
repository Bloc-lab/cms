import { API_BASE, tenantContextHeaders } from './api';

export interface PublicSiteInfo {
  siteName: string;
  logoUrl: string | null;
}

/** Branding for login (no auth; tenant z Host subdomény). */
export async function fetchPublicSiteInfo(): Promise<PublicSiteInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/site-info`, {
      headers: tenantContextHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicSiteInfo;
  } catch {
    return null;
  }
}

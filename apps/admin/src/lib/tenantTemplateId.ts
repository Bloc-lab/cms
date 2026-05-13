import { apiGet } from './api';

type SiteSettingsResp = { templateId?: string };

let cache: { id: string; at: number } | null = null;
const TTL_MS = 4000;

/** `site_settings.template_id` pro aktuálního tenanta (šablona obsahu v CMS). */
export async function getTenantTemplateId(): Promise<string> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache.id;
  }
  try {
    const s = await apiGet<SiteSettingsResp>('/api/v1/admin/site-settings');
    const raw = (s?.templateId ?? 'template1').trim();
    const id = raw || 'template1';
    cache = { id, at: now };
    return id;
  } catch {
    return 'template1';
  }
}

export function clearTenantTemplateIdCache() {
  cache = null;
}

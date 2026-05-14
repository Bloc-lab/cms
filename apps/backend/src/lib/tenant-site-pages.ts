import {
  getSitePagesForTemplate,
  sitePagesConfig,
  type SitePagesConfigMap,
} from '@nase-cms/shared';
import { supabaseAdmin } from './supabase.js';

export type TenantSiteContext = {
  templateId: string | null;
  pages: SitePagesConfigMap;
};

/**
 * `template_id` + mapa stránek podle šablony (jeden dotaz na `site_settings`).
 */
export async function loadTenantSiteContext(tenantId: string): Promise<TenantSiteContext> {
  if (!supabaseAdmin) {
    return { templateId: null, pages: sitePagesConfig };
  }
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('template_id')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !data) {
    return { templateId: null, pages: sitePagesConfig };
  }
  const raw = (data as { template_id?: string | null }).template_id;
  const templateId = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  return { templateId, pages: getSitePagesForTemplate(templateId) };
}

/**
 * Konfigurace stránek podle `site_settings.template_id` tenanta (validace konceptů / náhled).
 */
export async function loadSitePagesConfigForTenant(tenantId: string): Promise<SitePagesConfigMap> {
  const { pages } = await loadTenantSiteContext(tenantId);
  return pages;
}

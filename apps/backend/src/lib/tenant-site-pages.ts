import {
  getSitePagesForTemplate,
  sitePagesConfig,
  type SitePagesConfigMap,
} from '@nase-cms/shared';
import { supabaseAdmin } from './supabase.js';

/**
 * Konfigurace stránek podle `site_settings.template_id` tenanta (validace konceptů / náhled).
 */
export async function loadSitePagesConfigForTenant(tenantId: string): Promise<SitePagesConfigMap> {
  if (!supabaseAdmin) {
    return sitePagesConfig;
  }
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('template_id')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !data) {
    return sitePagesConfig;
  }
  return getSitePagesForTemplate((data as { template_id?: string | null }).template_id ?? null);
}

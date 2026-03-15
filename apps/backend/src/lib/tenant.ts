import { supabaseAdmin } from './supabase.js';
import { verifyApiKey } from './api-key.js';

const ADMIN_BASE_DOMAIN = process.env.ADMIN_BASE_DOMAIN ?? 'localhost';

export type TenantResolution =
  | { ok: true; tenantId: string }
  | { ok: false; status: 401; message: string }
  | { ok: false; status: 404; message: string }
  | { ok: false; status: 500; message: string };

/**
 * Resolve tenant from admin subdomain (e.g. kadernictvi.mojecms.cz → kadernictvi).
 */
export async function resolveTenantBySubdomain(host: string): Promise<TenantResolution> {
  const baseDomain = ADMIN_BASE_DOMAIN.toLowerCase();
  const hostLower = host.toLowerCase().split(':')[0]; // strip port

  let subdomain: string;
  if (hostLower.endsWith(`.${baseDomain}`)) {
    subdomain = hostLower.slice(0, -(baseDomain.length + 1)); // remove ".domain"
  } else if (hostLower === baseDomain) {
    return { ok: false, status: 404, message: 'Tenant subdomain required' };
  } else {
    return { ok: false, status: 404, message: 'Unknown tenant' };
  }

  if (!subdomain) {
    return { ok: false, status: 404, message: 'Unknown tenant' };
  }

  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('admin_subdomain', subdomain)
    .single();

  if (error || !data) {
    return { ok: false, status: 404, message: 'Tenant not found' };
  }

  return { ok: true, tenantId: data.id };
}

/**
 * Resolve tenant from X-API-KEY header.
 */
export async function resolveTenantByApiKey(apiKey: string | undefined): Promise<TenantResolution> {
  if (!apiKey?.trim()) {
    return { ok: false, status: 401, message: 'Missing or invalid X-API-KEY' };
  }

  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  const { data: tenants, error } = await supabaseAdmin
    .from('tenants')
    .select('id, api_key_hash')
    .not('api_key_hash', 'is', null);

  if (error) {
    return { ok: false, status: 500, message: 'Database error' };
  }

  const tenant = tenants?.find((t) => t.api_key_hash && verifyApiKey(apiKey, t.api_key_hash));
  if (!tenant) {
    return { ok: false, status: 401, message: 'Invalid X-API-KEY' };
  }

  return { ok: true, tenantId: tenant.id };
}

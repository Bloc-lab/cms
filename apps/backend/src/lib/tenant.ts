import { supabaseAdmin } from './supabase.js';
import { hashApiKey } from './api-key.js';
import { apiKeyTenantCacheKey, getCached, setCached } from './cache.js';

const ADMIN_BASE_DOMAIN = process.env.ADMIN_BASE_DOMAIN ?? 'localhost';

export type TenantResolution =
  | { ok: true; tenantId: string }
  | { ok: false; status: 401; message: string }
  | { ok: false; status: 404; message: string }
  | { ok: false; status: 500; message: string };

export type TenantHostKind = 'web' | 'admin';

const ADMIN_SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Slug jako v `tenants.admin_subdomain` (path-based admin / hlavička). */
export function parseCanonicalAdminSubdomain(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const t = raw.trim().toLowerCase();
  if (t.length < 1 || t.length > 63) return undefined;
  if (!ADMIN_SUBDOMAIN_RE.test(t)) return undefined;
  return t;
}

function normalizeHost(host: string): string {
  return host.toLowerCase().split(':')[0] ?? '';
}

/**
 * When the API is called with Host = the backend URL (e.g. *.onrender.com), tenant cannot be
 * inferred from subdomain. Set BACKEND_SERVICE_HOST + BACKEND_SERVICE_TENANT_ID on the server to
 * map that hostname to one tenant (single-tenant / PaaS demo).
 *
 * For `/api/v1/admin/*` and `/api/v1/public/*`, `x-tenant-subdomain` or `x-tenant-host` overrides
 * this pin so multi-tenant clients can target the correct tenant from one backend URL.
 */
export function resolveTenantIdForServiceHost(host: string): string | null {
  const configuredHost = process.env.BACKEND_SERVICE_HOST?.trim();
  const tenantId = process.env.BACKEND_SERVICE_TENANT_ID?.trim();
  if (!configuredHost || !tenantId) return null;
  if (normalizeHost(host) !== normalizeHost(configuredHost)) return null;
  return tenantId;
}

async function tenantByAdminSubdomainRow(subdomainLower: string): Promise<TenantResolution> {
  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('admin_subdomain', subdomainLower)
    .single();

  if (error || !data) {
    return { ok: false, status: 404, message: 'Tenant not found' };
  }

  return { ok: true, tenantId: data.id };
}

/**
 * Resolve tenant from admin subdomain (e.g. kadernictvi.mojecms.cz → kadernictvi).
 */
export async function resolveTenantBySubdomain(host: string): Promise<TenantResolution> {
  const baseDomain = ADMIN_BASE_DOMAIN.toLowerCase();
  const hostLower = normalizeHost(host); // strip port

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

  return tenantByAdminSubdomainRow(subdomain);
}

/**
 * Path-based admin (např. Vercel). Odkazuje na `tenants.admin_subdomain`.
 *
 * Neřeší {@link TenantHostKind} / tenant_domains typ `web` vs `admin`: jde o výběr tenanta pro admin API.
 */
export async function resolveTenantByAdminSubdomainSlug(slugRaw: string | undefined): Promise<TenantResolution> {
  const slug = parseCanonicalAdminSubdomain(slugRaw);
  if (!slug) {
    return { ok: false, status: 404, message: 'Unknown tenant' };
  }

  return tenantByAdminSubdomainRow(slug);
}

/**
 * Resolve tenant from Host header.
 *
 * Order:
 * 1) Exact match in tenant_domains.domain (custom domains)
 * 2) Subdomain match via ADMIN_BASE_DOMAIN (e.g. redu s.mojecms.cz)
 * 3) Optional legacy tenants.custom_domain exact match (fallback)
 */
export async function resolveTenantByHost(host: string, kind: TenantHostKind): Promise<TenantResolution> {
  const hostLower = normalizeHost(host);
  if (!hostLower) return { ok: false, status: 404, message: 'Unknown tenant' };

  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  // 1) tenant_domains (custom domains)
  const { data: domainRow, error: domainErr } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id,type')
    .eq('domain', hostLower)
    .maybeSingle();

  if (domainErr) {
    return { ok: false, status: 500, message: 'Database error' };
  }
  if (domainRow?.tenant_id) {
    // If kind mismatches, ignore (e.g. admin domain used for web)
    if ((domainRow as any).type === kind) {
      return { ok: true, tenantId: (domainRow as any).tenant_id as string };
    }
  }

  // 2) subdomain routing
  const bySub = await resolveTenantBySubdomain(hostLower);
  if (bySub.ok) return bySub;

  // 3) legacy custom_domain on tenants (optional)
  const { data: legacyRow, error: legacyErr } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('custom_domain', hostLower)
    .maybeSingle();

  if (legacyErr) {
    return { ok: false, status: 500, message: 'Database error' };
  }
  if (legacyRow?.id) return { ok: true, tenantId: legacyRow.id };

  return bySub;
}

/**
 * Resolve tenant from X-API-KEY header (indexed lookup by api_key_hash).
 */
export async function resolveTenantByApiKey(apiKey: string | undefined): Promise<TenantResolution> {
  const trimmed = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!trimmed) {
    return { ok: false, status: 401, message: 'Missing or invalid X-API-KEY' };
  }

  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  const keyHash = hashApiKey(trimmed);
  const memKey = apiKeyTenantCacheKey(keyHash);
  const cached = getCached<{ tenantId: string }>(memKey);
  if (cached?.tenantId) {
    return { ok: true, tenantId: cached.tenantId };
  }

  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('api_key_hash', keyHash)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, message: 'Database error' };
  }
  if (!tenant?.id) {
    return { ok: false, status: 401, message: 'Invalid X-API-KEY' };
  }

  setCached(memKey, { tenantId: tenant.id });
  return { ok: true, tenantId: tenant.id };
}

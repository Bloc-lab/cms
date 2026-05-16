/** First path segment for path-based tenants: /t/<slug>/… */
const TENANT_PATH_RE = /^\/t\/([^/]+)(?=\/|$)/;

export function slugFromTenantPath(pathname: string): string | undefined {
  const m = pathname.match(TENANT_PATH_RE);
  const s = m?.[1]?.trim().toLowerCase();
  return s?.length ? s : undefined;
}

/** Subdomain when the hostname looks like <slug>.BASE (e.g. kadernictvi.tvujcms.cz). */
export function slugFromAdminHostname(hostname: string, adminBaseDomain: string | undefined): string | undefined {
  const base = adminBaseDomain?.trim().toLowerCase();
  const host = hostname.trim().toLowerCase().split(':')[0];
  if (!base || !host) return undefined;
  if (host === base || host === `www.${base}`) return undefined;
  if (!host.endsWith(`.${base}`)) return undefined;
  const sub = host.slice(0, -(base.length + 1));
  return sub?.length ? sub : undefined;
}

/**
 * true = shared URL without a tenant subdomain (typically *.vercel.app) — use /t/&lt;slug&gt;/… paths.
 */
export function needsPathTenantSlug(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const base = import.meta.env.VITE_ADMIN_BASE_DOMAIN?.trim().toLowerCase();
  const fromHost = slugFromAdminHostname(window.location.hostname, base);
  if (fromHost) return false;
  if (slugFromTenantPath(window.location.pathname)) return false;
  if (host.startsWith('admin.localhost')) return false;
  return true;
}

/** Absolute URL nebo path k domovské stránce CMS pro daný tenant (demo přesměrování). */
export function tenantAdminHomeUrl(adminSubdomain: string): string {
  const slug = adminSubdomain.trim().toLowerCase();
  if (!slug || typeof window === 'undefined') return '/';
  if (needsPathTenantSlug()) {
    return `/t/${encodeURIComponent(slug)}/`;
  }
  const platformHost = window.location.host;
  const hostNoPort = platformHost.split(':')[0] ?? platformHost;
  const portPart = platformHost.includes(':') ? `:${platformHost.split(':')[1]}` : '';
  return `${window.location.protocol}//${slug}.${hostNoPort}${portPart}/`;
}

/** Absolute CMS login URL for a tenant (from platform `/platform/…`). */
export function platformTenantCmsUrl(adminSubdomain: string): string {
  const slug = adminSubdomain.trim().toLowerCase();
  if (!slug || typeof window === 'undefined') {
    return '/';
  }

  if (needsPathTenantSlug()) {
    return `${window.location.origin}/t/${encodeURIComponent(slug)}/login`;
  }

  const platformHost = window.location.host;
  const hostNoPort = platformHost.split(':')[0] ?? platformHost;
  const port = platformHost.includes(':') ? platformHost.split(':')[1] : '';
  const tenantHost = `${slug}.${hostNoPort}${port ? `:${port}` : ''}`;
  return `${window.location.protocol}//${tenantHost}/`;
}

/** Prefix for NavLink (`/t/slug` or empty). */
export function tenantPathPrefix(): string {
  const s = slugFromTenantPath(window.location.pathname);
  return s ? `/t/${s}` : '';
}

/** Absolute path in the current tenant scope (legacy root vs /t/&lt;slug&gt;). */
export function tenantHref(path: string): string {
  const p = tenantPathPrefix();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!p) return normalized;
  if (normalized === '/') return p;
  return `${p}${normalized}`;
}


import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  resolveTenantByHost,
  resolveTenantByApiKey,
  resolveTenantByAdminSubdomainSlug,
  resolveTenantIdForServiceHost,
  type TenantHostKind,
  type TenantResolution,
} from '../lib/tenant.js';
import { verifyAdminAuth } from '../lib/auth.js';

/** Zdroj vyřešení tenanta (effective host řetězec nebo client headers). */
type TenantResolveSource = 'requestHost' | 'x-tenant-host' | 'x-tenant-subdomain' | 'none';

function readHeader(request: FastifyRequest, name: string): string | undefined {
  const raw = request.headers[name];
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = typeof v === 'string' ? v.trim() : '';
  return t.length > 0 ? t : undefined;
}

/** When set, BACKEND_SERVICE_* pins one tenant - unless the client selects tenant via headers. */
function hasExplicitTenantSelectionHeaders(request: FastifyRequest): boolean {
  return (
    readHeader(request, 'x-tenant-subdomain') !== undefined ||
    readHeader(request, 'x-tenant-host') !== undefined
  );
}

function getEffectiveHost(request: FastifyRequest): string {
  const forwardedHostRaw = request.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw) ? forwardedHostRaw[0] : forwardedHostRaw;
  if (typeof forwardedHost === 'string' && forwardedHost.trim()) {
    return forwardedHost.trim();
  }
  return request.headers.host ?? '';
}

async function resolveTenantByHostWithFallback(
  logicalHost: string,
  request: FastifyRequest,
  kind: TenantHostKind
): Promise<{ result: TenantResolution; source: TenantResolveSource }> {
  const r1 = await resolveTenantByHost(logicalHost, kind);
  if (r1.ok) return { result: r1, source: 'requestHost' };

  let last: TenantResolution = r1;

  const tenantHostHeader = readHeader(request, 'x-tenant-host');
  if (tenantHostHeader) {
    const r2 = await resolveTenantByHost(tenantHostHeader, kind);
    last = r2;
    if (r2.ok) return { result: r2, source: 'x-tenant-host' };
  }

  const slugHeader = readHeader(request, 'x-tenant-subdomain');
  if (slugHeader) {
    const r3 = await resolveTenantByAdminSubdomainSlug(slugHeader);
    last = r3;
    if (r3.ok) return { result: r3, source: 'x-tenant-subdomain' };
  }

  return { result: last, source: 'none' };
}

function tenantResolutionLogFields(request: FastifyRequest, host: string) {
  return {
    effectiveHost: host,
    headers: {
      'x-tenant-host': readHeader(request, 'x-tenant-host'),
      'x-tenant-subdomain': readHeader(request, 'x-tenant-subdomain'),
    },
  };
}

/**
 * Multi-tenancy plugin.
 * Registers preHandler hooks for admin and content routes.
 *
 * Public routes (/api/v1/public/*): tenant z Host subdomény, bez auth (např. branding přihlášení).
 * Admin routes (/api/v1/admin/*): resolve tenant by Host subdomain + JWT auth
 * Content routes (/api/v1/content/*): resolve tenant by X-API-KEY header
 */
async function tenantPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.url;
    if (!url.startsWith('/api/v1/')) return;

    const host = getEffectiveHost(request);
    const serviceTenantId = resolveTenantIdForServiceHost(host);

    // Platform (company) admin routes: no tenant resolution, just auth later in route handlers.
    // These endpoints are meant to run on a special URL without tenant subdomain.
    if (url.startsWith('/api/v1/platform/')) {
      request.tenantSource = 'platform';
      return;
    }

    // Public demo signup / template list — no tenant context
    if (url.startsWith('/api/v1/demo/')) {
      request.tenantSource = 'demo';
      return;
    }

    if (url.startsWith('/api/v1/public/')) {
      if (serviceTenantId && !hasExplicitTenantSelectionHeaders(request)) {
        request.tenantId = serviceTenantId;
        request.tenantSource = 'public';
        return;
      }

      const { result: byHost, source } = await resolveTenantByHostWithFallback(host, request, 'web');
      if (byHost.ok) {
        request.tenantId = byHost.tenantId;
        request.tenantSource = 'public';
        if (source !== 'requestHost' && source !== 'none') {
          request.log.info(
            { ...tenantResolutionLogFields(request, host), route: 'public', source, ok: true },
            'Tenant resolution'
          );
        }
        return;
      }

      // Fallback for public endpoints when web uses API key (no tenant subdomain).
      const raw = request.headers['x-api-key'];
      const apiKey = Array.isArray(raw) ? raw[0] : raw;
      const byKey = await resolveTenantByApiKey(typeof apiKey === 'string' ? apiKey : undefined);

      const chosen = byKey.ok ? byKey : byHost;
      request.log.info(
        {
          ...tenantResolutionLogFields(request, host),
          route: 'public',
          source,
          hostChain: byHost.ok ? 'ok' : byHost,
          apiKey: byKey.ok ? 'ok' : byKey,
        },
        'Tenant resolution'
      );

      if (!chosen.ok) {
        return reply.status(chosen.status).send({ error: chosen.message });
      }

      request.tenantId = chosen.tenantId;
      request.tenantSource = 'public';
      return;
    }

    if (url.startsWith('/api/v1/admin/')) {
      if (serviceTenantId && !hasExplicitTenantSelectionHeaders(request)) {
        request.tenantId = serviceTenantId;
        request.tenantSource = 'admin';

        const user = await verifyAdminAuth(request, reply);
        if (!user) return;
        request.userId = user.id;
        return;
      }

      const { result, source } = await resolveTenantByHostWithFallback(host, request, 'admin');
      request.log.info(
        {
          ...tenantResolutionLogFields(request, host),
          route: 'admin',
          source,
          outcome: result.ok ? 'ok' : result,
        },
        'Tenant resolution'
      );

      if (!result.ok) {
        return reply.status(result.status).send({ error: result.message });
      }
      request.tenantId = result.tenantId;
      request.tenantSource = 'admin';

      const user = await verifyAdminAuth(request, reply);
      if (!user) return;
      request.userId = user.id;
      return;
    }

    if (url.startsWith('/api/v1/content')) {
      const raw = request.headers['x-api-key'];
      const apiKey = Array.isArray(raw) ? raw[0] : raw;
      const result = await resolveTenantByApiKey(typeof apiKey === 'string' ? apiKey : undefined);
      if (!result.ok) {
        return reply.status(result.status).send({ error: result.message });
      }
      request.tenantId = result.tenantId;
      request.tenantSource = 'api-key';
      return;
    }
  });
}

export default fp(tenantPlugin, { name: 'tenant' });

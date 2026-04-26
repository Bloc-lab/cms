import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { resolveTenantBySubdomain, resolveTenantByApiKey } from '../lib/tenant.js';
import { verifyAdminAuth } from '../lib/auth.js';

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

    // Platform (company) admin routes: no tenant resolution, just auth later in route handlers.
    // These endpoints are meant to run on a special URL without tenant subdomain.
    if (url.startsWith('/api/v1/platform/')) {
      request.tenantSource = 'platform';
      return;
    }

    if (url.startsWith('/api/v1/public/')) {
      const host = request.headers.host ?? '';
      const byHost = await resolveTenantBySubdomain(host);
      if (byHost.ok) {
        request.tenantId = byHost.tenantId;
        request.tenantSource = 'public';
        return;
      }

      // Fallback for public endpoints when web uses API key (no tenant subdomain).
      const raw = request.headers['x-api-key'];
      const apiKey = Array.isArray(raw) ? raw[0] : raw;
      const byKey = await resolveTenantByApiKey(typeof apiKey === 'string' ? apiKey : undefined);

      const chosen = byKey.ok ? byKey : byHost;
      request.log.info(
        { host, publicRoute: true, byHost: byHost.ok ? 'ok' : byHost, byKey: byKey.ok ? 'ok' : byKey },
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
      const host = request.headers.host ?? '';
      const result = await resolveTenantBySubdomain(host);
      request.log.info({ host, result: result.ok ? 'ok' : result }, 'Tenant resolution');
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

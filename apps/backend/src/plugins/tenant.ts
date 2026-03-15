import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { resolveTenantBySubdomain, resolveTenantByApiKey } from '../lib/tenant.js';
import { verifyAdminAuth } from '../lib/auth.js';

/**
 * Multi-tenancy plugin.
 * Registers preHandler hooks for admin and content routes.
 *
 * Admin routes (/api/v1/admin/*): resolve tenant by Host subdomain + JWT auth
 * Content routes (/api/v1/content/*): resolve tenant by X-API-KEY header
 */
async function tenantPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.url;
    if (!url.startsWith('/api/v1/')) return;

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
      const apiKey = request.headers['x-api-key'];
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

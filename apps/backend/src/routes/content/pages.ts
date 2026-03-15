import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { getCached, setCached, cacheKey } from '../../lib/cache.js';

const DEFAULT_LANG = 'cs';

interface ContentQuery {
  lang?: string;
}

export async function contentPagesRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ContentQuery }>(
    '/api/v1/content',
    async (request: FastifyRequest<{ Querystring: ContentQuery }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) {
        return reply.status(500).send({ error: 'Tenant not resolved' });
      }

      const lang = request.query.lang ?? DEFAULT_LANG;
      const cacheKeyStr = cacheKey(tenantId, 'content', lang);
      const cached = getCached<Record<string, string>>(cacheKeyStr);
      if (cached) {
        return reply.send(cached);
      }

      if (!supabaseAdmin) {
        return reply.status(500).send({ error: 'Server misconfiguration' });
      }

      const { data: entries, error } = await supabaseAdmin
        .from('content_entries')
        .select('key, value')
        .eq('tenant_id', tenantId)
        .eq('lang', lang);

      if (error) {
        request.log.error({ err: error }, 'Failed to fetch content');
        return reply.status(500).send({ error: 'Failed to fetch content' });
      }

      const response: Record<string, string> = {};
      for (const e of entries ?? []) {
        response[e.key] = e.value ?? '';
      }

      setCached(cacheKeyStr, response);
      return reply.send(response);
    }
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { legacyContentKeyToStorageKey, toPublicContentKey } from '@nase-cms/shared';
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

      const rows = [...(entries ?? [])].sort((a, b) => {
        const aNew = !a.key.startsWith('admin.') && a.key.includes(':');
        const bNew = !b.key.startsWith('admin.') && b.key.includes(':');
        if (aNew && !bNew) return 1;
        if (!aNew && bNew) return -1;
        return 0;
      });

      const response: Record<string, string> = {};
      for (const e of rows) {
        const raw = e.key;
        if (raw.startsWith('admin.')) {
          response[raw] = e.value ?? '';
          continue;
        }
        const normalized = legacyContentKeyToStorageKey(raw);
        const publicKey = toPublicContentKey(normalized);
        response[publicKey] = e.value ?? '';
      }

      setCached(cacheKeyStr, response);
      return reply.send(response);
    }
  );
}

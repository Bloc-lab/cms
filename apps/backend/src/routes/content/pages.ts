import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { getCached, setCached, cacheKey } from '../../lib/cache.js';
import { rowsToPublicContentMap } from '../../lib/public-content-map.js';
import { loadPreviewPayload } from '../../lib/preview-public-data.js';
import { resolvePreviewTokenPageId } from '../../lib/preview-token.js';

const DEFAULT_LANG = 'cs';

interface ContentQuery {
  lang?: string;
  previewToken?: string;
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
      const previewToken =
        typeof request.query.previewToken === 'string' ? request.query.previewToken : undefined;

      if (previewToken?.trim()) {
        if (!supabaseAdmin) {
          return reply.status(500).send({ error: 'Server misconfiguration' });
        }
        const pageId = await resolvePreviewTokenPageId(tenantId, previewToken);
        if (!pageId) {
          return reply.status(403).send({ error: 'Invalid or expired preview token' });
        }
        try {
          const payload = await loadPreviewPayload(tenantId, pageId, lang);
          return reply.send(payload.content);
        } catch (e) {
          request.log.error({ err: e }, 'public content preview');
          const msg = e instanceof Error ? e.message : 'Preview failed';
          return reply.status(500).send({ error: 'Failed to load preview content', detail: msg });
        }
      }

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

      const response = rowsToPublicContentMap(entries ?? []);

      setCached(cacheKeyStr, response);
      return reply.send(response);
    }
  );
}

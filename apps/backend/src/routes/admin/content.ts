import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { invalidateContentCache } from '../../lib/invalidate.js';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

export async function adminContentRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/content', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      request.log.warn({ tenantId }, 'List content: missing tenant');
      return reply.status(500).send({ error: 'Server error', detail: 'Tenant not resolved' });
    }

    const { data, error } = await supabaseAdmin
      .from('content_entries')
      .select('key, lang, value')
      .eq('tenant_id', tenantId)
      .order('key')
      .order('lang');

    if (error) {
      request.log.error({ err: error }, 'Failed to list content');
      return reply.status(500).send({ error: 'Failed to list content', detail: error.message });
    }

    return reply.send({ entries: data ?? [] });
  });

  app.put<{
    Body: { entries: ContentEntry[] };
  }>(
    '/api/v1/admin/content',
    async (
      request: FastifyRequest<{ Body: { entries: ContentEntry[] } }>,
      reply: FastifyReply
    ) => {
      const tenantId = request.tenantId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const { entries } = request.body ?? {};
      if (!Array.isArray(entries) || entries.length === 0) {
        return reply.status(400).send({ error: 'entries array is required' });
      }

      for (const e of entries) {
        if (!e.key || !e.lang) {
          return reply.status(400).send({ error: 'Each entry must have key and lang' });
        }
      }

      for (const e of entries) {
        const { error } = await supabaseAdmin
          .from('content_entries')
          .upsert(
            {
              tenant_id: tenantId,
              key: e.key,
              lang: e.lang,
              value: e.value ?? '',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'tenant_id,key,lang' }
          );

        if (error) {
          request.log.error({ err: error, key: e.key }, 'Failed to upsert content entry');
          return reply.status(500).send({ error: 'Failed to save content', detail: error.message });
        }
      }

      invalidateContentCache(tenantId);
      return reply.send({ ok: true });
    }
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { invalidateContentCache } from '../../lib/invalidate.js';

const SUPPORTED_LANGS = ['cs', 'en'];

export async function adminPagesRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/pages', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      request.log.warn({ tenantId }, 'List pages: missing tenant');
      return reply.status(500).send({ error: 'Server error', detail: 'Tenant not resolved' });
    }

    const { data: pagesData, error: pagesError } = await supabaseAdmin
      .from('pages')
      .select('id, slug, status, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (pagesError) {
      request.log.error({ err: pagesError, code: pagesError.code }, 'Failed to list pages');
      return reply.status(500).send({ error: 'Failed to list pages', detail: pagesError.message });
    }

    const pageIds = (pagesData ?? []).map((p) => p.id);
    let translationsMap: Record<string, string> = {};

    if (pageIds.length > 0) {
      const { data: transData } = await supabaseAdmin
        .from('page_translations')
        .select('page_id, title')
        .in('page_id', pageIds)
        .eq('lang', 'cs');
      translationsMap = (transData ?? []).reduce((acc, t) => {
        acc[t.page_id] = t.title;
        return acc;
      }, {} as Record<string, string>);
    }

    const pages = (pagesData ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      title: translationsMap[p.id] ?? '-',
      updated_at: p.updated_at,
    }));

    return reply.send({ pages });
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/admin/pages/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const { id } = request.params;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const { data: page, error: pageError } = await supabaseAdmin
        .from('pages')
        .select('id, tenant_id, slug, status, created_at, updated_at')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (pageError || !page) {
        return reply.status(404).send({ error: 'Page not found' });
      }

      const { data: translations } = await supabaseAdmin
        .from('page_translations')
        .select('id, lang, title, content, updated_at')
        .eq('page_id', id)
        .order('lang');

      return reply.send({
        ...page,
        translations: translations ?? [],
      });
    }
  );

  app.post<{ Body: { slug: string; title?: string; status?: string } }>(
    '/api/v1/admin/pages',
    async (request: FastifyRequest<{ Body: { slug: string; title?: string; status?: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const { slug, title = 'Nová stránka', status = 'draft' } = request.body ?? {};
      if (!tenantId || !supabaseAdmin) {
        request.log.warn({ tenantId, hasSupabaseAdmin: !!supabaseAdmin }, 'Create page: missing tenant or supabase');
        return reply.status(500).send({ error: 'Server error', detail: !tenantId ? 'Tenant not resolved (použij subdoménu, např. kadernictvi.localhost)' : 'Database not configured' });
      }
      if (!slug?.trim()) {
        return reply.status(400).send({ error: 'Slug is required' });
      }

      const { data: page, error: pageError } = await supabaseAdmin
        .from('pages')
        .insert({ tenant_id: tenantId, slug: slug.trim(), status })
        .select('id, slug, status, created_at')
        .single();

      if (pageError) {
        if (pageError.code === '23505') {
          return reply.status(409).send({ error: 'Page with this slug already exists' });
        }
        request.log.error({ err: pageError, code: pageError.code, message: pageError.message }, 'Failed to create page');
        return reply.status(500).send({ error: 'Failed to create page', detail: pageError.message });
      }

      const { error: transError } = await supabaseAdmin.from('page_translations').insert({
        page_id: page.id,
        lang: 'cs',
        title,
        content: { blocks: [] },
      });

      if (transError) {
        request.log.error({ err: transError }, 'Failed to create page translation');
        await supabaseAdmin.from('pages').delete().eq('id', page.id);
        return reply.status(500).send({ error: 'Failed to create page translation', detail: transError.message });
      }

      invalidateContentCache(tenantId);
      return reply.status(201).send(page);
    }
  );

  app.put<{
    Params: { id: string };
    Body: { slug?: string; status?: string; translations?: Array<{ lang: string; title: string; content: { blocks: unknown[] } }> };
  }>(
    '/api/v1/admin/pages/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { slug?: string; status?: string; translations?: Array<{ lang: string; title: string; content: { blocks: unknown[] } }> };
      }>,
      reply: FastifyReply
    ) => {
      const tenantId = request.tenantId;
      const userId = request.userId;
      const { id } = request.params;
      const { slug, status, translations } = request.body ?? {};
      if (!tenantId || !userId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const { data: page, error: pageError } = await supabaseAdmin
        .from('pages')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (pageError || !page) {
        return reply.status(404).send({ error: 'Page not found' });
      }

      if (slug !== undefined) {
        await supabaseAdmin.from('pages').update({ slug: slug.trim(), updated_at: new Date().toISOString() }).eq('id', id);
      }
      if (status !== undefined) {
        await supabaseAdmin.from('pages').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      }

      if (translations?.length) {
        for (const t of translations) {
          if (!SUPPORTED_LANGS.includes(t.lang)) continue;

          const { data: existing } = await supabaseAdmin
            .from('page_translations')
            .select('id, content')
            .eq('page_id', id)
            .eq('lang', t.lang)
            .single();

          if (existing?.content) {
            await supabaseAdmin.from('page_history').insert({
              page_id: id,
              lang: t.lang,
              content_snapshot: existing.content,
              changed_by: userId,
            });
          }

          await supabaseAdmin
            .from('page_translations')
            .upsert(
              {
                page_id: id,
                lang: t.lang,
                title: t.title,
                content: t.content,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'page_id,lang' }
            );
        }
      }

      invalidateContentCache(tenantId);

      const { data: updated } = await supabaseAdmin
        .from('pages')
        .select('id, slug, status, updated_at')
        .eq('id', id)
        .single();

      return reply.send(updated ?? { id, slug, status });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/api/v1/admin/pages/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const { id } = request.params;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const { error } = await supabaseAdmin.from('pages').delete().eq('id', id).eq('tenant_id', tenantId);

      if (error) {
        return reply.status(500).send({ error: 'Failed to delete page' });
      }

      invalidateContentCache(tenantId);
      return reply.status(204).send();
    }
  );
}

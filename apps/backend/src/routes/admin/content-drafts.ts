import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ADMIN_ENABLED_LANGS_KEY, mergeContentEntriesMap, sitePagesConfig, storageKey } from '@nase-cms/shared';
import { supabaseAdmin } from '../../lib/supabase.js';
import { invalidateContentCache } from '../../lib/invalidate.js';
import { loadPreviewPayload } from '../../lib/preview-public-data.js';
import { insertContentPreviewToken } from '../../lib/preview-token.js';
import { toDbAdminSiteSettings, validateAndNormalizeAdminSiteSettings, type SiteSettingsAdmin } from '../../lib/site-settings.js';

const PRIMARY_LANG = 'cs';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

function normalizeLangs(langs: string[]): string[] {
  const set = new Set(langs.map((l) => l.trim().toLowerCase()).filter(Boolean));
  set.add(PRIMARY_LANG);
  const knownOrder = ['cs', 'en', 'de', 'sk', 'pl', 'fr', 'it', 'es'];
  const known = knownOrder.filter((l) => set.has(l));
  const unknown = [...set].filter((l) => !knownOrder.includes(l)).sort();
  return [...known, ...unknown];
}

function parseEnabledLangsFromMap(entriesMap: Record<string, string>): string[] {
  const raw =
    entriesMap[`${ADMIN_ENABLED_LANGS_KEY}:${PRIMARY_LANG}`] ??
    entriesMap[`${ADMIN_ENABLED_LANGS_KEY}:en`] ??
    '';
  const langs = raw
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (langs.length === 0) return [PRIMARY_LANG, 'en'];
  return normalizeLangs(langs);
}

function isValidPageId(pageId: string): boolean {
  return Boolean(pageId && sitePagesConfig[pageId as keyof typeof sitePagesConfig]);
}

function pageStorageKeys(pageId: string): string[] {
  const def = sitePagesConfig[pageId as keyof typeof sitePagesConfig];
  if (!def) return [];
  return Object.keys(def.fields).map((fieldKey) => storageKey(pageId, fieldKey));
}

const allowedKeysSet = (pageId: string) => new Set(pageStorageKeys(pageId));

function validateDraftEntries(pageId: string, entries: ContentEntry[] | undefined): ContentEntry[] | null {
  if (!Array.isArray(entries)) return null;
  const allowed = allowedKeysSet(pageId);
  for (const e of entries) {
    if (!e.key || !e.lang) return null;
    if (!allowed.has(e.key)) return null;
  }
  return entries;
}

export async function adminContentDraftsRoutes(app: FastifyInstance) {
  app.post<{ Body: { pageId?: string } }>(
    '/api/v1/admin/content-preview-token',
    async (request: FastifyRequest<{ Body: { pageId?: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const userId = request.userId;
      const pageId = request.body?.pageId?.trim() ?? '';
      if (!tenantId) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }
      try {
        const { plainToken, expiresAt } = await insertContentPreviewToken({
          tenantId,
          pageId,
          userId,
        });
        return reply.send({ token: plainToken, expiresAt, pageId });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create token';
        if (msg.includes('missing') || msg.includes('Apply migration')) {
          return reply.status(503).send({ error: msg });
        }
        request.log.error(e);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  app.get<{ Params: { pageId: string } }>(
    '/api/v1/admin/content-drafts/:pageId',
    async (request: FastifyRequest<{ Params: { pageId: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const pageId = request.params.pageId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }

      const { data: draftRows, error: dErr } = await supabaseAdmin
        .from('content_entry_drafts')
        .select('key, lang, value')
        .eq('tenant_id', tenantId)
        .eq('page_id', pageId)
        .order('key')
        .order('lang');

      if (dErr) {
        const msg = dErr.message ?? '';
        if (/does not exist|could not find the table/i.test(msg) || (dErr as { code?: string }).code === '42P01') {
          return reply.send({ entries: [], siteSettings: null });
        }
        request.log.error({ err: dErr }, 'list content drafts');
        return reply.status(500).send({ error: 'Failed to load drafts', detail: dErr.message });
      }

      let siteSettings: SiteSettingsAdmin | null = null;
      if (pageId === 'main') {
        const { data: srow, error: sErr } = await supabaseAdmin
          .from('site_settings_drafts')
          .select('settings')
          .eq('tenant_id', tenantId)
          .eq('page_id', 'main')
          .maybeSingle();

        if (
          sErr &&
          !/does not exist|could not find the table/i.test(sErr.message ?? '') &&
          (sErr as { code?: string }).code !== '42P01'
        ) {
          request.log.error({ err: sErr }, 'load site settings draft');
          return reply.status(500).send({ error: 'Failed to load site settings draft', detail: sErr.message });
        }
        if (srow?.settings && typeof srow.settings === 'object') {
          const parsed = validateAndNormalizeAdminSiteSettings(srow.settings);
          if (parsed.ok) siteSettings = parsed.value;
        }
      }

      return reply.send({
        entries: draftRows ?? [],
        siteSettings,
      });
    }
  );

  app.put<{
    Params: { pageId: string };
    Body: { entries?: ContentEntry[]; siteSettings?: unknown };
  }>(
    '/api/v1/admin/content-drafts/:pageId',
    async (
      request: FastifyRequest<{
        Params: { pageId: string };
        Body: { entries?: ContentEntry[]; siteSettings?: unknown };
      }>,
      reply: FastifyReply
    ) => {
      const tenantId = request.tenantId;
      const userId = request.userId;
      const pageId = request.params.pageId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }

      const entries = validateDraftEntries(pageId, request.body?.entries);
      if (!entries) {
        return reply.status(400).send({ error: 'Invalid entries payload' });
      }

      const now = new Date().toISOString();

      for (const e of entries) {
        const { error } = await supabaseAdmin.from('content_entry_drafts').upsert(
          {
            tenant_id: tenantId,
            page_id: pageId,
            key: e.key,
            lang: e.lang,
            value: e.value ?? '',
            publishing_status: 'not_published',
            updated_at: now,
            updated_by: userId ?? null,
          },
          { onConflict: 'tenant_id,page_id,key,lang' }
        );
        if (error) {
          const msg = error.message ?? '';
          if (/does not exist|could not find the table/i.test(msg)) {
            return reply.status(503).send({
              error: 'Draft storage not available',
              detail: 'Apply migration 010_content_and_site_settings_drafts.sql',
            });
          }
          request.log.error({ err: error }, 'upsert content draft');
          return reply.status(500).send({ error: 'Failed to save draft', detail: error.message });
        }
      }

      if (pageId === 'main' && request.body?.siteSettings !== undefined) {
        const parsed = validateAndNormalizeAdminSiteSettings(request.body.siteSettings);
        if (!parsed.ok) {
          return reply.status(400).send({ error: parsed.error });
        }
        const { error: sErr } = await supabaseAdmin.from('site_settings_drafts').upsert(
          {
            tenant_id: tenantId,
            page_id: 'main',
            settings: parsed.value as unknown as Record<string, unknown>,
            publishing_status: 'not_published',
            updated_at: now,
            updated_by: userId ?? null,
          },
          { onConflict: 'tenant_id,page_id' }
        );
        if (sErr) {
          const msg = sErr.message ?? '';
          if (/does not exist|could not find the table/i.test(msg)) {
            return reply.status(503).send({
              error: 'Draft storage not available',
              detail: 'Apply migration 010_content_and_site_settings_drafts.sql',
            });
          }
          request.log.error({ err: sErr }, 'upsert site settings draft');
          return reply.status(500).send({ error: 'Failed to save site settings draft', detail: sErr.message });
        }
      }

      return reply.send({ ok: true });
    }
  );

  app.delete<{ Params: { pageId: string } }>(
    '/api/v1/admin/content-drafts/:pageId',
    async (request: FastifyRequest<{ Params: { pageId: string } }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      const pageId = request.params.pageId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }

      const { error: dErr } = await supabaseAdmin
        .from('content_entry_drafts')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('page_id', pageId);

      if (dErr && !/does not exist|could not find the table/i.test(dErr.message ?? '')) {
        request.log.error({ err: dErr }, 'delete content drafts');
        return reply.status(500).send({ error: 'Failed to discard content drafts', detail: dErr.message });
      }

      if (pageId === 'main') {
        const { error: sErr } = await supabaseAdmin
          .from('site_settings_drafts')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('page_id', 'main');
        if (sErr && !/does not exist|could not find the table/i.test(sErr.message ?? '')) {
          request.log.error({ err: sErr }, 'delete site settings draft');
          return reply.status(500).send({ error: 'Failed to discard site settings draft', detail: sErr.message });
        }
      }

      return reply.status(204).send();
    }
  );

  app.post<{
    Params: { pageId: string };
    Body: { enabledLangs?: string[] };
  }>(
    '/api/v1/admin/content-drafts/:pageId/publish',
    async (
      request: FastifyRequest<{
        Params: { pageId: string };
        Body: { enabledLangs?: string[] };
      }>,
      reply: FastifyReply
    ) => {
      const tenantId = request.tenantId;
      const pageId = request.params.pageId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }

      const { data: draftRows, error: dLoadErr } = await supabaseAdmin
        .from('content_entry_drafts')
        .select('key, lang, value')
        .eq('tenant_id', tenantId)
        .eq('page_id', pageId);

      if (dLoadErr) {
        const msg = dLoadErr.message ?? '';
        if (/does not exist|could not find the table/i.test(msg)) {
          return reply.status(503).send({
            error: 'Draft storage not available',
            detail: 'Apply migration 010_content_and_site_settings_drafts.sql',
          });
        }
        request.log.error({ err: dLoadErr }, 'load drafts for publish');
        return reply.status(500).send({ error: 'Failed to load drafts', detail: dLoadErr.message });
      }

      let siteDraft: SiteSettingsAdmin | null = null;
      if (pageId === 'main') {
        const { data: srow } = await supabaseAdmin
          .from('site_settings_drafts')
          .select('settings')
          .eq('tenant_id', tenantId)
          .eq('page_id', 'main')
          .maybeSingle();
        if (srow?.settings) {
          const parsed = validateAndNormalizeAdminSiteSettings(srow.settings);
          if (parsed.ok) siteDraft = parsed.value;
        }
      }

      const drafts = draftRows ?? [];
      if (drafts.length === 0 && !siteDraft) {
        return reply.status(400).send({ error: 'Nic k publikování — nejdřív uložte koncept.' });
      }

      const { data: allPublished, error: pubErr } = await supabaseAdmin
        .from('content_entries')
        .select('key, lang, value')
        .eq('tenant_id', tenantId);

      if (pubErr) {
        request.log.error({ err: pubErr }, 'load published for publish');
        return reply.status(500).send({ error: 'Failed to load published content', detail: pubErr.message });
      }

      const publishedMap = mergeContentEntriesMap(allPublished ?? []);

      const mergedMap: Record<string, string> = { ...publishedMap };
      for (const row of drafts) {
        mergedMap[`${row.key}:${row.lang}`] = row.value ?? '';
      }

      const enabledLangs =
        Array.isArray(request.body?.enabledLangs) && request.body.enabledLangs.length > 0
          ? normalizeLangs(request.body.enabledLangs.map((l) => String(l)))
          : parseEnabledLangsFromMap(mergedMap);

      const pageDef = sitePagesConfig[pageId as keyof typeof sitePagesConfig];
      const fieldErrors: Record<string, string> = {};
      for (const [fieldKey, field] of Object.entries(pageDef.fields)) {
        if (!field.required) continue;
        const sk = storageKey(pageId, fieldKey);
        const filled = enabledLangs.some((l) => (mergedMap[`${sk}:${l}`] ?? '').trim());
        if (!filled) {
          fieldErrors[sk] = 'Povinné pole';
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        return reply.status(400).send({ error: 'Zkontrolujte povinná pole.', fieldErrors });
      }

      for (const row of drafts) {
        const { error } = await supabaseAdmin.from('content_entries').upsert(
          {
            tenant_id: tenantId,
            key: row.key,
            lang: row.lang,
            value: row.value ?? '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,key,lang' }
        );
        if (error) {
          request.log.error({ err: error }, 'publish content entry');
          return reply.status(500).send({ error: 'Failed to publish content', detail: error.message });
        }
      }

      if (pageId === 'main' && siteDraft) {
        const dbRow = toDbAdminSiteSettings(siteDraft);
        const { error: sErr } = await supabaseAdmin.from('site_settings').upsert(
          {
            tenant_id: tenantId,
            ...dbRow,
          },
          { onConflict: 'tenant_id' }
        );
        if (sErr) {
          request.log.error({ err: sErr }, 'publish site settings');
          return reply.status(500).send({ error: 'Failed to publish site settings', detail: sErr.message });
        }
      }

      await supabaseAdmin.from('content_entry_drafts').delete().eq('tenant_id', tenantId).eq('page_id', pageId);
      if (pageId === 'main') {
        await supabaseAdmin.from('site_settings_drafts').delete().eq('tenant_id', tenantId).eq('page_id', 'main');
      }

      invalidateContentCache(tenantId);
      return reply.send({ ok: true });
    }
  );

  app.get<{ Params: { pageId: string }; Querystring: { lang?: string } }>(
    '/api/v1/admin/content-preview/:pageId',
    async (
      request: FastifyRequest<{ Params: { pageId: string }; Querystring: { lang?: string } }>,
      reply: FastifyReply
    ) => {
      const tenantId = request.tenantId;
      const pageId = request.params.pageId;
      const lang = request.query.lang ?? PRIMARY_LANG;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }
      if (!isValidPageId(pageId)) {
        return reply.status(400).send({ error: 'Unknown page' });
      }

      try {
        const payload = await loadPreviewPayload(tenantId, pageId, lang);
        return reply.send({
          lang: payload.lang,
          content: payload.content,
          ...(payload.siteSettings ? { siteSettings: payload.siteSettings } : {}),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Preview failed';
        request.log.error({ err: e }, 'admin content-preview');
        return reply.status(500).send({ error: 'Failed to load preview', detail: msg });
      }
    }
  );
}

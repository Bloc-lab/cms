import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { DEFAULT_PUBLIC_SITE_SETTINGS, toPublicSiteSettings } from '../../lib/site-settings.js';
import { loadPreviewPayload } from '../../lib/preview-public-data.js';
import {
  parsePreviewTokenFromRequestQuery,
  resolvePreviewFromPlainTokenDetails,
} from '../../lib/preview-token.js';
import { setNoStoreCacheHeaders, setPublicCacheHeaders } from '../../lib/http-cache.js';

const DEFAULT_LANG = 'cs';

type SiteSettingsQuery = { previewToken?: string; lang?: string };

/**
 * Public read-only site settings for web templates (tenant from Host subdomain).
 */
export async function publicSiteSettingsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: SiteSettingsQuery }>(
    '/api/v1/public/site-settings',
    async (request: FastifyRequest<{ Querystring: SiteSettingsQuery }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const previewToken = parsePreviewTokenFromRequestQuery(request.query as Record<string, unknown>);

      /** Tenant for DB reads: preview token embeds the correct tenant (hash is global). */
      let settingsTenantId = tenantId;

      if (previewToken) {
        const resolved = await resolvePreviewFromPlainTokenDetails(previewToken);
        if (!resolved.ok) {
          if (resolved.reason === 'no_service') {
            return reply.status(500).send({ error: 'Server error' });
          }
          if (resolved.reason === 'expired') {
            return reply.status(403).send({
              error: 'Preview token expired',
              detail: 'Vygenerujte nový odkaz náhledu v administraci (platnost cca 1 hodina).',
            });
          }
          return reply.status(403).send({ error: 'Invalid or expired preview token' });
        }
        settingsTenantId = resolved.tenantId;
        if (resolved.pageId === 'main') {
          const lang = typeof request.query.lang === 'string' ? request.query.lang : DEFAULT_LANG;
          try {
            const payload = await loadPreviewPayload(settingsTenantId, 'main', lang);
            if (payload.siteSettings) {
              setNoStoreCacheHeaders(reply);
              return reply.send(payload.siteSettings);
            }
          } catch (e) {
            request.log.error({ err: e }, 'public site-settings preview');
            const msg = e instanceof Error ? e.message : 'Preview failed';
            return reply.status(500).send({ error: 'Failed to load preview site settings', detail: msg });
          }
        }
        /* Token scoped to non-main page: draft site_settings does not apply - return published. */
      }

      const { data: row, error } = await supabaseAdmin
        .from('site_settings')
        .select(
          'template_id, theme_primary, theme_secondary1, theme_secondary2, nav_json, cta_variant, cta_submit_label, cta_success_message, cta_form_layout'
        )
        .eq('tenant_id', settingsTenantId)
        .maybeSingle();

      if (error) {
        const code = (error as unknown as { code?: string }).code ?? '';
        const message = (error as unknown as { message?: string }).message ?? '';
        if (
          code === '42P01' ||
          code === 'PGRST205' ||
          /relation .*site_settings.* does not exist/i.test(message) ||
          /could not find the table .*site_settings/i.test(message)
        ) {
          // Migration not applied yet – behave like "no settings" so frontend can use defaults.
          setPublicCacheHeaders(reply, ['Host', 'X-API-KEY']);
          return reply.send(DEFAULT_PUBLIC_SITE_SETTINGS);
        }
        request.log.error({ err: error }, 'public site-settings');
        return reply.status(500).send({ error: 'Failed to load site settings' });
      }

      if (!row) {
        setPublicCacheHeaders(reply, ['Host', 'X-API-KEY']);
        return reply.send(DEFAULT_PUBLIC_SITE_SETTINGS);
      }

      setPublicCacheHeaders(reply, ['Host', 'X-API-KEY']);
      return reply.send(
        toPublicSiteSettings(row as unknown as {
          template_id: string | null;
          theme_primary: string | null;
          theme_secondary1: string | null;
          theme_secondary2: string | null;
          nav_json?: unknown;
          cta_variant: string | null;
          cta_submit_label: string | null;
          cta_success_message: string | null;
          cta_form_layout?: string | null;
        })
      );
    }
  );
}

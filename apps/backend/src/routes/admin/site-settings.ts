import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import {
  DEFAULT_ADMIN_SITE_SETTINGS,
  type SiteSettingsAdmin,
  toAdminSiteSettings,
  toDbAdminSiteSettings,
  validateAndNormalizeAdminSiteSettings,
} from '../../lib/site-settings.js';

export async function adminSiteSettingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/site-settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data: row, error } = await supabaseAdmin
      .from('site_settings')
      .select(
        'template_id, theme_primary, theme_secondary1, theme_secondary2, cta_variant, cta_submit_label, cta_success_message, cta_form_layout, lead_notification_email, lead_formspree_url'
      )
      .eq('tenant_id', tenantId)
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
        return reply.send(DEFAULT_ADMIN_SITE_SETTINGS);
      }
      request.log.error({ err: error }, 'admin site-settings get');
      return reply.status(500).send({ error: 'Failed to load site settings' });
    }

    if (!row) return reply.send(DEFAULT_ADMIN_SITE_SETTINGS);
    return reply.send(toAdminSiteSettings(row as any));
  });

  app.put<{ Body: SiteSettingsAdmin }>(
    '/api/v1/admin/site-settings',
    async (request: FastifyRequest<{ Body: SiteSettingsAdmin }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ error: 'Server error' });
      }

      const parsed = validateAndNormalizeAdminSiteSettings(request.body);
      if (!parsed.ok) {
        return reply.status(400).send({ error: parsed.error });
      }

      const dbRow = toDbAdminSiteSettings(parsed.value);

      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert(
          {
            tenant_id: tenantId,
            ...dbRow,
          },
          { onConflict: 'tenant_id' }
        );

      if (error) {
        request.log.error({ err: error }, 'admin site-settings upsert');
        return reply.status(500).send({ error: 'Failed to save site settings', detail: error.message });
      }

      return reply.send({ ok: true });
    }
  );
}


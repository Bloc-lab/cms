import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { DEFAULT_PUBLIC_SITE_SETTINGS, toPublicSiteSettings } from '../../lib/site-settings.js';

/**
 * Public read-only site settings for web templates (tenant from Host subdomain).
 */
export async function publicSiteSettingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/public/site-settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data: row, error } = await supabaseAdmin
      .from('site_settings')
      .select(
        'template_id, theme_primary, theme_secondary1, theme_secondary2, cta_variant, cta_phone_label, cta_email_label, cta_submit_label, cta_success_message'
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
        // Migration not applied yet – behave like "no settings" so frontend can use defaults.
        return reply.send(DEFAULT_PUBLIC_SITE_SETTINGS);
      }
      request.log.error({ err: error }, 'public site-settings');
      return reply.status(500).send({ error: 'Failed to load site settings' });
    }

    if (!row) {
      return reply.send(DEFAULT_PUBLIC_SITE_SETTINGS);
    }

    return reply.send(
      toPublicSiteSettings(row as unknown as {
        template_id: string | null;
        theme_primary: string | null;
        theme_secondary1: string | null;
        theme_secondary2: string | null;
        cta_variant: string | null;
        cta_phone_label: string | null;
        cta_email_label: string | null;
        cta_submit_label: string | null;
        cta_success_message: string | null;
      })
    );
  });
}


import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { setPublicCacheHeaders } from '../../lib/http-cache.js';

const BRANDING_KEYS = ['admin.siteName', 'admin.logo'] as const;

/**
 * Public read-only branding for login screen (tenant from Host subdomain).
 */
export async function publicSiteInfoRoutes(app: FastifyInstance) {
  app.get('/api/v1/public/site-info', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.tenantId;
    if (!tenantId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('content_entries')
      .select('key, lang, value')
      .eq('tenant_id', tenantId)
      .in('key', [...BRANDING_KEYS]);

    if (error) {
      request.log.error({ err: error }, 'public site-info');
      return reply.status(500).send({ error: 'Failed to load site info' });
    }

    const map: Record<string, string> = {};
    for (const row of rows ?? []) {
      const r = row as { key: string; lang: string; value: string | null };
      map[`${r.key}:${r.lang}`] = r.value ?? '';
    }

    const fromContent = (map['admin.siteName:cs'] ?? map['admin.siteName:en'] ?? '').trim();

    const { data: tenantRow } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const fromTenant = (tenantRow?.name ?? '').trim();
    const siteName = fromContent || fromTenant;

    const logoRaw = (map['admin.logo:cs'] ?? map['admin.logo:en'] ?? '').trim();
    const logoUrl = logoRaw || null;

    setPublicCacheHeaders(reply, ['Host', 'X-API-KEY']);
    return reply.send({ siteName, logoUrl });
  });
}

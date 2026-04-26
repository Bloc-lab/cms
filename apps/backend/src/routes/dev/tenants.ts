import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { defaultConfig } from '@nase-cms/shared';
import { resolveSeedValue, type SeedPreset } from '../../lib/seed-lorem.js';

type DevTenantListItem = {
  id: string;
  name: string;
  admin_subdomain: string;
  custom_domain: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  template?: { id?: string | null; version?: number | null };
};

async function verifySuperAdmin(request: FastifyRequest, reply: FastifyReply): Promise<{ userId: string } | null> {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return null;
  }

  if (!supabaseAdmin) {
    reply.status(500).send({ error: 'Server misconfiguration' });
    return null;
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'SUPER_ADMIN') {
    reply.status(403).send({ error: 'SUPER_ADMIN required' });
    return null;
  }

  return { userId: user.id };
}

export async function devTenantsRoutes(app: FastifyInstance) {
  app.get('/api/v1/dev/tenants', async (request: FastifyRequest, reply: FastifyReply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const q = typeof (request.query as any)?.q === 'string' ? ((request.query as any).q as string).trim() : '';

    let tenantsQuery = supabaseAdmin
      .from('tenants')
      .select('id,name,admin_subdomain,custom_domain,status,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (q) {
      // PostgREST "or" syntax: ilike matches for name/admin_subdomain/custom_domain
      const esc = q.replace(/[%_]/g, '\\$&');
      tenantsQuery = tenantsQuery.or(`name.ilike.%${esc}%,admin_subdomain.ilike.%${esc}%,custom_domain.ilike.%${esc}%`);
    }

    const { data: tenants, error } = await tenantsQuery;
    if (error) {
      request.log.error({ err: error }, 'dev tenants list');
      return reply.status(500).send({ error: 'Failed to load tenants' });
    }

    const ids = (tenants ?? []).map((t) => t.id);
    let settingsMap = new Map<string, { template_id: string | null; template_version: number | null }>();
    if (ids.length) {
      const { data: settings } = await supabaseAdmin
        .from('site_settings')
        .select('tenant_id,template_id,template_version')
        .in('tenant_id', ids);
      for (const s of settings ?? []) {
        settingsMap.set((s as any).tenant_id, {
          template_id: (s as any).template_id ?? null,
          template_version: (s as any).template_version ?? null,
        });
      }
    }

    const out: DevTenantListItem[] = (tenants ?? []).map((t) => {
      const s = settingsMap.get(t.id);
      return {
        ...t,
        template: { id: s?.template_id ?? null, version: s?.template_version ?? null },
      } as DevTenantListItem;
    });

    return reply.send({ tenants: out });
  });

  app.post<{
    Params: { id: string };
    Body: { preset?: SeedPreset; overwrite?: boolean; langs?: string[] };
  }>('/api/v1/dev/tenants/:id/seed', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const preset: SeedPreset = request.body?.preset === 'redus' ? 'redus' : 'lorem';
    const overwrite = request.body?.overwrite === true;
    const langsInput = Array.isArray(request.body?.langs) ? request.body.langs : undefined;
    const langs = (langsInput?.length ? langsInput : ['cs', 'en', 'it'])
      .map((l) => (typeof l === 'string' ? l.trim().toLowerCase() : ''))
      .filter(Boolean);
    if (!langs.includes('cs')) langs.unshift('cs');
    const uniqueLangs = [...new Set(langs)].slice(0, 10);

    const { data: tenant, error: tenantErr } = await supabaseAdmin.from('tenants').select('id').eq('id', tenantId).single();
    if (tenantErr || !tenant) {
      return reply.status(404).send({ error: 'Tenant not found' });
    }

    const configKeys = Object.keys(defaultConfig);
    const now = new Date().toISOString();
    type Row = { tenant_id: string; key: string; lang: string; value: string; updated_at: string };

    const candidateRows: Row[] = [];
    for (const lang of uniqueLangs) {
      for (const key of configKeys) {
        const value = resolveSeedValue(preset, key);
        candidateRows.push({ tenant_id: tenantId, key, lang, value, updated_at: now });
      }
    }

    let rows = candidateRows;
    if (!overwrite) {
      const { data: existing, error: readErr } = await supabaseAdmin
        .from('content_entries')
        .select('key,lang,value')
        .eq('tenant_id', tenantId);
      if (readErr) {
        request.log.error({ err: readErr }, 'dev seed read existing');
        return reply.status(500).send({ error: 'Failed to read existing content' });
      }

      const hasValue = new Set<string>();
      for (const row of existing ?? []) {
        const r = row as { key: string; lang: string; value: string | null };
        if ((r.value ?? '').trim().length > 0) {
          hasValue.add(`${r.key}\0${r.lang}`);
        }
      }
      rows = candidateRows.filter((r) => !hasValue.has(`${r.key}\0${r.lang}`));
    }

    const chunk = 200;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += chunk) {
      const part = rows.slice(i, i + chunk);
      const { error } = await supabaseAdmin.from('content_entries').upsert(part, { onConflict: 'tenant_id,key,lang' });
      if (error) {
        request.log.error({ err: error }, 'dev seed upsert');
        return reply.status(500).send({ error: 'Failed to seed content', detail: error.message });
      }
      upserted += part.length;
    }

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'seed_content',
      meta: { preset, overwrite, langs: uniqueLangs, upserted },
    });

    return reply.send({ ok: true, preset, overwrite, langs: uniqueLangs, upserted });
  });
}


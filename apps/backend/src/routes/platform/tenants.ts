import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { defaultConfig } from '@nase-cms/shared';
import { resolveSeedValue, type SeedPreset } from '../../lib/seed-lorem.js';

type PlatformTenantListItem = {
  id: string;
  name: string;
  admin_subdomain: string;
  custom_domain: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  template?: { id?: string | null; version?: number | null };
};

type PlatformTenantDomain = {
  id: string;
  domain: string;
  type: 'web' | 'admin';
  is_primary: boolean;
  redirect_to_primary: boolean;
  created_at: string;
  updated_at: string;
};

type PlatformTenantUserItem = {
  user_id: string;
  role: 'SUPER_ADMIN' | 'EDITOR' | string;
  email: string;
};

type CreatePlatformTenantBody = {
  tenantName: string;
  adminSubdomain: string;
  userEmail: string;
  userPassword: string;
  userRole?: 'EDITOR' | 'SUPER_ADMIN';
  templateId?: string;
  templateVersion?: number;
};

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

  request.userId = user.id;
  return { userId: user.id };
}

export async function platformTenantsRoutes(app: FastifyInstance) {
  app.post<{ Body: CreatePlatformTenantBody }>('/api/v1/platform/tenants', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const body = request.body ?? ({} as CreatePlatformTenantBody);
    const tenantName = typeof body.tenantName === 'string' ? body.tenantName.trim() : '';
    const adminSubdomain = typeof body.adminSubdomain === 'string' ? body.adminSubdomain.trim().toLowerCase() : '';
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail.trim().toLowerCase() : '';
    const userPassword = typeof body.userPassword === 'string' ? body.userPassword : '';
    const userRole = body.userRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EDITOR';
    const templateId = typeof body.templateId === 'string' && body.templateId.trim() ? body.templateId.trim() : 'template1';
    const templateVersionRaw = body.templateVersion;
    const templateVersion =
      typeof templateVersionRaw === 'number' && Number.isFinite(templateVersionRaw) && templateVersionRaw >= 1
        ? Math.floor(templateVersionRaw)
        : 1;

    if (!tenantName) return reply.status(400).send({ error: 'tenantName is required' });
    if (!adminSubdomain || !/^[a-z0-9-]{2,50}$/.test(adminSubdomain)) {
      return reply.status(400).send({ error: 'adminSubdomain must be 2-50 chars: a-z, 0-9, hyphen' });
    }
    if (!userEmail || !isValidEmail(userEmail)) return reply.status(400).send({ error: 'userEmail is invalid' });
    if (!userPassword || userPassword.length < 8) return reply.status(400).send({ error: 'userPassword must be at least 8 characters' });

    // 1) create auth user (Supabase Auth)
    const { data: createdUser, error: createUserErr } = await (supabaseAdmin as any).auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });
    if (createUserErr || !createdUser?.user?.id) {
      return reply.status(400).send({ error: 'Failed to create user', detail: createUserErr?.message ?? 'Unknown error' });
    }
    const newUserId = createdUser.user.id as string;

    // 2) create tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .insert({ name: tenantName, admin_subdomain: adminSubdomain })
      .select('id,name,admin_subdomain,custom_domain,status,created_at,updated_at')
      .single();
    if (tenantErr || !tenant) {
      return reply.status(400).send({ error: 'Failed to create tenant', detail: tenantErr?.message ?? 'Unknown error' });
    }

    // 3) link user to tenant
    const { error: linkErr } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id: (tenant as any).id,
      user_id: newUserId,
      role: userRole,
    });
    if (linkErr) {
      return reply.status(400).send({ error: 'Failed to link user to tenant', detail: linkErr.message });
    }

    // 4) ensure template row exists
    const { error: settingsErr } = await supabaseAdmin.from('site_settings').upsert(
      {
        tenant_id: (tenant as any).id,
        template_id: templateId,
        template_version: templateVersion,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );
    if (settingsErr) {
      return reply.status(500).send({ error: 'Failed to save site settings', detail: settingsErr.message });
    }

    // 5) set profile role if needed (trigger creates EDITOR by default)
    if (userRole === 'SUPER_ADMIN') {
      await supabaseAdmin.from('profiles').update({ role: 'SUPER_ADMIN' }).eq('id', newUserId);
    }

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: (tenant as any).id,
      actor_user_id: ok.userId,
      action: 'tenant_create',
      meta: { tenantName, adminSubdomain, userEmail, userRole, templateId, templateVersion },
    });

    return reply.status(201).send({
      tenant,
      user: { id: newUserId, email: userEmail, role: userRole },
    });
  });

  app.get('/api/v1/platform/tenants', async (request: FastifyRequest, reply: FastifyReply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const q = typeof (request.query as any)?.q === 'string' ? ((request.query as any).q as string).trim() : '';

    let tenantsQuery = supabaseAdmin
      .from('tenants')
      .select('id,name,admin_subdomain,custom_domain,status,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (q) {
      const esc = q.replace(/[%_]/g, '\\$&');
      tenantsQuery = tenantsQuery.or(`name.ilike.%${esc}%,admin_subdomain.ilike.%${esc}%,custom_domain.ilike.%${esc}%`);
    }

    const { data: tenants, error } = await tenantsQuery;
    if (error) {
      request.log.error({ err: error }, 'platform tenants list');
      return reply.status(500).send({ error: 'Failed to load tenants' });
    }

    const ids = (tenants ?? []).map((t) => t.id);
    const settingsMap = new Map<string, { template_id: string | null; template_version: number | null }>();
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

    const out: PlatformTenantListItem[] = (tenants ?? []).map((t) => {
      const s = settingsMap.get(t.id);
      return {
        ...t,
        template: { id: s?.template_id ?? null, version: s?.template_version ?? null },
      } as PlatformTenantListItem;
    });

    return reply.send({ tenants: out });
  });

  app.get<{ Params: { id: string } }>('/api/v1/platform/tenants/:id', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .select('id,name,admin_subdomain,custom_domain,status,internal_notes,created_at,updated_at')
      .eq('id', tenantId)
      .single();
    if (tenantErr || !tenant) return reply.status(404).send({ error: 'Tenant not found' });

    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('template_id,template_version')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { data: domains } = await supabaseAdmin
      .from('tenant_domains')
      .select('id,domain,type,is_primary,redirect_to_primary,created_at,updated_at')
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    return reply.send({
      tenant,
      template: {
        id: (settings as any)?.template_id ?? null,
        version: (settings as any)?.template_version ?? null,
      },
      domains: (domains ?? []) as unknown as PlatformTenantDomain[],
    });
  });

  app.get<{ Params: { id: string } }>('/api/v1/platform/tenants/:id/users', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;

    const { data: links, error: linksErr } = await supabaseAdmin
      .from('tenant_users')
      .select('user_id,role,created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
    if (linksErr) return reply.status(500).send({ error: 'Failed to load tenant users', detail: linksErr.message });

    const userIds = (links ?? []).map((l) => (l as any).user_id as string).filter(Boolean);
    let profilesMap = new Map<string, { email: string }>();
    if (userIds.length) {
      const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('id,email').in('id', userIds);
      if (profErr) return reply.status(500).send({ error: 'Failed to load profiles', detail: profErr.message });
      for (const p of profiles ?? []) {
        profilesMap.set((p as any).id, { email: (p as any).email ?? '' });
      }
    }

    const out: PlatformTenantUserItem[] = (links ?? []).map((l) => ({
      user_id: (l as any).user_id,
      role: (l as any).role,
      email: profilesMap.get((l as any).user_id)?.email ?? '',
    }));

    return reply.send({ users: out });
  });

  app.post<{
    Params: { id: string };
    Body: { email: string; password: string; role?: 'EDITOR' | 'SUPER_ADMIN' };
  }>('/api/v1/platform/tenants/:id/users', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const role = request.body?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EDITOR';

    if (!email || !isValidEmail(email)) return reply.status(400).send({ error: 'email is invalid' });
    if (!password || password.length < 8) return reply.status(400).send({ error: 'password must be at least 8 characters' });

    const { data: tenant, error: tenantErr } = await supabaseAdmin.from('tenants').select('id').eq('id', tenantId).single();
    if (tenantErr || !tenant) return reply.status(404).send({ error: 'Tenant not found' });

    const { data: createdUser, error: createUserErr } = await (supabaseAdmin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createUserErr || !createdUser?.user?.id) {
      return reply.status(400).send({ error: 'Failed to create user', detail: createUserErr?.message ?? 'Unknown error' });
    }
    const userId = createdUser.user.id as string;

    const { error: linkErr } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
    });
    if (linkErr) return reply.status(400).send({ error: 'Failed to link user to tenant', detail: linkErr.message });

    if (role === 'SUPER_ADMIN') {
      await supabaseAdmin.from('profiles').update({ role: 'SUPER_ADMIN' }).eq('id', userId);
    }

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'tenant_user_add',
      meta: { email, role },
    });

    return reply.status(201).send({ user: { id: userId, email, role } });
  });

  app.patch<{
    Params: { id: string };
    Body: { name?: string; adminSubdomain?: string; status?: 'active' | 'paused' | 'deleted'; internal_notes?: string | null };
  }>('/api/v1/platform/tenants/:id', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const body = request.body ?? {};

    const patch: any = { updated_at: new Date().toISOString() };
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (typeof body.adminSubdomain === 'string') {
      const next = body.adminSubdomain.trim().toLowerCase();
      if (!next || !/^[a-z0-9-]{2,50}$/.test(next)) {
        return reply.status(400).send({ error: 'adminSubdomain must be 2-50 chars: a-z, 0-9, hyphen' });
      }
      patch.admin_subdomain = next;
    }
    if (body.status === 'active' || body.status === 'paused' || body.status === 'deleted') patch.status = body.status;
    if (body.internal_notes === null) patch.internal_notes = null;
    if (typeof body.internal_notes === 'string') patch.internal_notes = body.internal_notes;

    const { data: updated, error } = await supabaseAdmin
      .from('tenants')
      .update(patch)
      .eq('id', tenantId)
      .select('id,name,admin_subdomain,custom_domain,status,internal_notes,created_at,updated_at')
      .single();
    if (error) {
      const msg = (error as any)?.message ?? '';
      if (/duplicate key value|unique constraint|tenants_admin_subdomain_key/i.test(msg)) {
        return reply.status(409).send({ error: 'adminSubdomain already in use' });
      }
      return reply.status(500).send({ error: 'Failed to update tenant', detail: msg || 'Unknown error' });
    }
    if (!updated) return reply.status(404).send({ error: 'Tenant not found' });

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'tenant_update',
      meta: { patch: { ...patch, updated_at: undefined } },
    });

    return reply.send({ tenant: updated });
  });

  app.put<{
    Params: { id: string };
    Body: { templateId: string; templateVersion?: number };
  }>('/api/v1/platform/tenants/:id/template', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const templateId = typeof request.body?.templateId === 'string' ? request.body.templateId.trim() : '';
    const templateVersionRaw = request.body?.templateVersion;
    const templateVersion =
      typeof templateVersionRaw === 'number' && Number.isFinite(templateVersionRaw) && templateVersionRaw >= 1
        ? Math.floor(templateVersionRaw)
        : 1;

    if (!templateId) return reply.status(400).send({ error: 'templateId is required' });

    const { error } = await supabaseAdmin.from('site_settings').upsert(
      {
        tenant_id: tenantId,
        template_id: templateId,
        template_version: templateVersion,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );
    if (error) return reply.status(500).send({ error: 'Failed to save template', detail: error.message });

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'template_update',
      meta: { templateId, templateVersion },
    });

    return reply.send({ ok: true });
  });

  app.post<{
    Params: { id: string };
    Body: { domain: string; type?: 'web' | 'admin'; isPrimary?: boolean; redirectToPrimary?: boolean };
  }>('/api/v1/platform/tenants/:id/domains', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const domain = typeof request.body?.domain === 'string' ? request.body.domain.trim().toLowerCase() : '';
    const type: 'web' | 'admin' = request.body?.type === 'admin' ? 'admin' : 'web';
    const isPrimary = request.body?.isPrimary === true;
    const redirectToPrimary = request.body?.redirectToPrimary !== false;

    if (!domain) return reply.status(400).send({ error: 'domain is required' });
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) && !domain.endsWith('.localhost')) {
      return reply.status(400).send({ error: 'domain format invalid' });
    }

    if (isPrimary) {
      await supabaseAdmin.from('tenant_domains').update({ is_primary: false }).eq('tenant_id', tenantId).eq('type', type);
    }

    const { data, error } = await supabaseAdmin
      .from('tenant_domains')
      .insert({
        tenant_id: tenantId,
        domain,
        type,
        is_primary: isPrimary,
        redirect_to_primary: redirectToPrimary,
        updated_at: new Date().toISOString(),
      })
      .select('id,domain,type,is_primary,redirect_to_primary,created_at,updated_at')
      .single();
    if (error || !data) return reply.status(500).send({ error: 'Failed to add domain', detail: error?.message });

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'domain_add',
      meta: { domain, type, isPrimary, redirectToPrimary },
    });

    return reply.status(201).send({ domain: data });
  });

  app.delete<{ Params: { id: string; domainId: string } }>('/api/v1/platform/tenants/:id/domains/:domainId', async (request, reply) => {
    const ok = await verifySuperAdmin(request, reply);
    if (!ok || !supabaseAdmin) return;

    const tenantId = request.params.id;
    const domainId = request.params.domainId;

    const { data: row } = await supabaseAdmin
      .from('tenant_domains')
      .select('id,domain,type')
      .eq('id', domainId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { error } = await supabaseAdmin.from('tenant_domains').delete().eq('id', domainId).eq('tenant_id', tenantId);
    if (error) return reply.status(500).send({ error: 'Failed to delete domain', detail: error.message });

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'domain_delete',
      meta: { domainId, ...(row ? { domain: (row as any).domain, type: (row as any).type } : {}) },
    });

    return reply.status(204).send();
  });

  app.post<{
    Params: { id: string };
    Body: { preset?: SeedPreset; overwrite?: boolean; langs?: string[] };
  }>('/api/v1/platform/tenants/:id/seed', async (request, reply) => {
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
        const value = resolveSeedValue(preset, key, lang);
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
        request.log.error({ err: readErr }, 'platform seed read existing');
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
        request.log.error({ err: error }, 'platform seed upsert');
        return reply.status(500).send({ error: 'Failed to seed content', detail: error.message });
      }
      upserted += part.length;
    }

    await supabaseAdmin.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      actor_user_id: ok.userId,
      action: 'seed_content',
      meta: { preset, overwrite, langs: uniqueLangs, upserted, scope: 'platform' },
    });

    return reply.send({ ok: true, preset, overwrite, langs: uniqueLangs, upserted });
  });
}


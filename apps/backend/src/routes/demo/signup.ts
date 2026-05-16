import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { supabaseAdmin } from '../../lib/supabase.js';
import { seedDefaultTemplateContent } from '../../lib/seed-default-template-content.js';

const DEFAULT_DEMO_TEMPLATE_IDS = ['template1', 'template2', 'template3', 'arch'] as const;

const TEMPLATE_LABELS: Record<string, string> = {
  template1: 'MONO',
  template2: 'FLOW',
  template3: 'BLOCK',
  arch: 'ARCH (renovace)',
};

function parseDemoTemplateAllowList(): string[] {
  const raw = process.env.DEMO_TEMPLATE_IDS?.trim();
  if (!raw) return [...DEFAULT_DEMO_TEMPLATE_IDS];
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length ? [...new Set(parts)] : [...DEFAULT_DEMO_TEMPLATE_IDS];
}

function isAllowedTemplateId(id: string, allow: Set<string>): boolean {
  return allow.has(id.trim().toLowerCase());
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function generateUniqueDemoSubdomain(): Promise<string> {
  if (!supabaseAdmin) throw new Error('Server misconfiguration');
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix = crypto.randomBytes(6).toString('hex');
    const candidate = `demo-${suffix}`;
    const { data } = await supabaseAdmin.from('tenants').select('id').eq('admin_subdomain', candidate).maybeSingle();
    if (!data?.id) return candidate;
  }
  throw new Error('Could not allocate unique demo subdomain');
}

type DemoSignupBody = {
  email?: string;
  password?: string;
  templateId?: string;
};

export async function demoSignupRoutes(app: FastifyInstance) {
  app.get('/api/v1/demo/templates', async (_request: FastifyRequest, reply: FastifyReply) => {
    const allow = parseDemoTemplateAllowList();
    const templates = allow.map((id) => ({
      id,
      label: TEMPLATE_LABELS[id] ?? id,
    }));
    return reply.send({ templates });
  });

  app.post<{ Body: DemoSignupBody }>('/api/v1/demo/signup', async (request, reply) => {
    if (!supabaseAdmin) {
      return reply.status(500).send({ error: 'Server misconfiguration' });
    }

    const allowList = parseDemoTemplateAllowList();
    const allow = new Set(allowList);

    const body = request.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const templateIdRaw = typeof body.templateId === 'string' ? body.templateId.trim().toLowerCase() : '';

    if (!email || !isValidEmail(email)) {
      return reply.status(400).send({ error: 'Invalid email' });
    }
    if (!password || password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }
    if (!templateIdRaw || !isAllowedTemplateId(templateIdRaw, allow)) {
      return reply.status(400).send({ error: 'Invalid or disallowed templateId' });
    }

    const adminSubdomain = await generateUniqueDemoSubdomain();
    const tenantName = `Demo – ${email.split('@')[0] || 'uživatel'}`;

    let newUserId: string | null = null;
    let createdTenantId: string | null = null;

    try {
      const { data: createdUser, error: createUserErr } = await (supabaseAdmin as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          demo_admin_subdomain: adminSubdomain,
        },
      });

      if (createUserErr || !createdUser?.user?.id) {
        const msg = createUserErr?.message ?? 'Unknown error';
        if (/already|registered|exists/i.test(msg)) {
          return reply.status(409).send({ error: 'User with this email already exists' });
        }
        return reply.status(400).send({ error: 'Failed to create user', detail: msg });
      }

      newUserId = createdUser.user.id as string;

      const { data: tenant, error: tenantErr } = await supabaseAdmin
        .from('tenants')
        .insert({ name: tenantName, admin_subdomain: adminSubdomain })
        .select('id,name,admin_subdomain,custom_domain,status,created_at,updated_at')
        .single();

      if (tenantErr || !tenant) {
        throw new Error(tenantErr?.message ?? 'Failed to create tenant');
      }

      const tenantId = (tenant as { id: string }).id;
      createdTenantId = tenantId;

      const { error: linkErr } = await supabaseAdmin.from('tenant_users').insert({
        tenant_id: tenantId,
        user_id: newUserId,
        role: 'EDITOR',
      });
      if (linkErr) {
        throw new Error(linkErr.message);
      }

      const { error: settingsErr } = await supabaseAdmin.from('site_settings').upsert(
        {
          tenant_id: tenantId,
          template_id: templateIdRaw,
          template_version: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      );
      if (settingsErr) {
        throw new Error(settingsErr.message);
      }

      const { error: demoErr } = await supabaseAdmin.from('profiles').update({ is_demo: true }).eq('id', newUserId);
      if (demoErr) {
        throw new Error(demoErr.message);
      }

      try {
        await seedDefaultTemplateContent(supabaseAdmin, {
          tenantId,
          templateId: templateIdRaw,
          langs: ['cs', 'en'],
          overwrite: false,
        });
      } catch (seedErr) {
        request.log.error({ err: seedErr }, 'demo signup seed');
        throw seedErr instanceof Error ? seedErr : new Error('Seed failed');
      }

      return reply.status(201).send({
        tenant: {
          id: tenantId,
          admin_subdomain: adminSubdomain,
          name: tenantName,
        },
        user: { id: newUserId, email },
        templateId: templateIdRaw,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Signup failed';

      if (createdTenantId) {
        try {
          await supabaseAdmin.from('tenants').delete().eq('id', createdTenantId);
        } catch (delTenErr) {
          request.log.error({ err: delTenErr, tenantId: createdTenantId }, 'rollback delete tenant failed');
        }
      }

      if (newUserId) {
        try {
          await (supabaseAdmin as any).auth.admin.deleteUser(newUserId);
        } catch (delErr) {
          request.log.error({ err: delErr, userId: newUserId }, 'rollback deleteUser failed');
        }
      }

      request.log.error({ err: e }, 'demo signup');
      return reply.status(500).send({ error: 'Demo signup failed', detail: msg });
    }
  });
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { checkAndBumpRateLimit, rateLimitKeyFromRequest } from '../../lib/rate-limit.js';

type LeadRequest = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  website?: string; // honeypot
};

function cleanText(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  // pragmatic validation (RFC-perfect is not needed here)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function forwardToFormspree(args: {
  formUrl: string;
  lead: { name: string; email: string; phone: string | null; message: string | null; source: string; tenantId: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(args.formUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: args.lead.name,
        email: args.lead.email,
        phone: args.lead.phone ?? undefined,
        message: args.lead.message ?? undefined,
        source: args.lead.source,
        tenantId: args.lead.tenantId,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, error: t || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function publicLeadRoutes(app: FastifyInstance) {
  app.post<{ Body: LeadRequest }>(
    '/api/v1/public/lead',
    async (request: FastifyRequest<{ Body: LeadRequest }>, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId || !supabaseAdmin) {
        return reply.status(500).send({ ok: false, error: 'Server error' });
      }

      const rateKey = rateLimitKeyFromRequest({ ip: request.ip, tenantId, route: 'public/lead' });
      const rl = checkAndBumpRateLimit(rateKey);
      if (!rl.ok) {
        reply.header('Retry-After', String(rl.retryAfterSeconds));
        return reply.status(429).send({ ok: false, error: 'Too many requests' });
      }

      const body = request.body ?? ({} as LeadRequest);
      const honeypot = cleanText((body as LeadRequest).website, 200);
      if (honeypot) {
        // Pretend success for bots.
        return reply.status(200).send({ ok: true });
      }

      const name = cleanText(body.name, 120);
      const email = cleanText(body.email, 200).toLowerCase();
      const phone = cleanText(body.phone, 50) || null;
      const message = cleanText(body.message, 4000) || null;
      const source = cleanText(body.source, 50) || 'cta';

      if (!name) return reply.status(400).send({ ok: false, error: 'Missing name' });
      if (!email || !isValidEmail(email)) return reply.status(400).send({ ok: false, error: 'Invalid email' });

      const ip = cleanText(request.ip, 64) || null;
      const userAgent = cleanText(request.headers['user-agent'], 500) || null;

      const { error } = await supabaseAdmin.from('leads').insert({
        tenant_id: tenantId,
        name,
        email,
        phone,
        message,
        source,
        ip,
        user_agent: userAgent,
      });

      if (error) {
        const code = (error as unknown as { code?: string }).code ?? '';
        const message = (error as unknown as { message?: string }).message ?? '';
        if (code === '42P01' || code === 'PGRST205' || /could not find the table .*leads/i.test(message)) {
          return reply.status(503).send({ ok: false, error: 'Leads storage not configured' });
        }
        request.log.error({ err: error }, 'public lead insert failed');
        return reply.status(500).send({ ok: false, error: 'Failed to submit lead' });
      }

      // Optional Formspree forwarding per tenant (if configured)
      try {
        const { data: settingsRow } = await supabaseAdmin
          .from('site_settings')
          .select('lead_formspree_url')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        const formUrl =
          typeof settingsRow?.lead_formspree_url === 'string' ? settingsRow.lead_formspree_url.trim() : '';
        if (formUrl) {
          const delivered = await forwardToFormspree({
            formUrl,
            lead: { name, email, phone, message, source, tenantId },
          });
          if (!delivered.ok) {
            request.log.error({ err: delivered.error }, 'formspree delivery failed');
            return reply.status(502).send({ ok: false, error: 'Failed to deliver lead' });
          }
        }
      } catch {
        // ignore (lead already stored)
      }

      return reply.status(201).send({ ok: true });
    }
  );
}


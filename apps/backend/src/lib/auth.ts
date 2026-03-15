import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabase, supabaseAdmin } from './supabase.js';
import type { User } from '@supabase/supabase-js';

export async function verifyAdminAuth(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
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

  const tenantId = request.tenantId;
  if (!tenantId) {
    reply.status(500).send({ error: 'Tenant not resolved' });
    return null;
  }

  if (!supabaseAdmin) {
    reply.status(500).send({ error: 'Server misconfiguration' });
    return null;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'SUPER_ADMIN') {
    return user;
  }

  const { data: tenantUser } = await supabaseAdmin
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) {
    reply.status(403).send({ error: 'Access denied to this tenant' });
    return null;
  }

  return user;
}

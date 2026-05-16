import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';

export async function adminMeRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId;
    if (!userId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('email,role,is_demo')
      .eq('id', userId)
      .single();
    if (error || !profile) {
      return reply.status(500).send({ error: 'Failed to load profile' });
    }

    const p = profile as { email: string; role: string; is_demo?: boolean };
    return reply.send({
      id: userId,
      email: p.email,
      role: p.role,
      isDemo: p.is_demo === true,
    });
  });
}


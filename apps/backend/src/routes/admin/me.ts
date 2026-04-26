import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';

export async function adminMeRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId;
    if (!userId || !supabaseAdmin) {
      return reply.status(500).send({ error: 'Server error' });
    }

    const { data: profile, error } = await supabaseAdmin.from('profiles').select('email,role').eq('id', userId).single();
    if (error || !profile) {
      return reply.status(500).send({ error: 'Failed to load profile' });
    }

    return reply.send({ id: userId, email: profile.email, role: profile.role });
  });
}


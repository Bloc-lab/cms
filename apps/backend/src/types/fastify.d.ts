import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    tenantSource?: 'admin' | 'api-key';
    userId?: string;
  }
}

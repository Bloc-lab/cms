import './env.js';
import Fastify from 'fastify';
import { supabase } from './lib/supabase.js';
import tenantPlugin from './plugins/tenant.js';
import { contentPagesRoutes } from './routes/content/pages.js';
import { adminMediaRoutes } from './routes/admin/media.js';
import { adminContentRoutes } from './routes/admin/content.js';
import { adminPagesRoutes } from './routes/admin/pages.js';
import { publicSiteInfoRoutes } from './routes/public/site-info.js';

const app = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT ?? '3000', 10);

await app.register(tenantPlugin);
await app.register(contentPagesRoutes);
await app.register(publicSiteInfoRoutes);
await app.register(adminMediaRoutes);
await app.register(adminContentRoutes);
await app.register(adminPagesRoutes);

// Health check (no tenant required)
app.get('/health', async () => {
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    return {
      status: 'ok',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return { status: 'error', database: 'error', timestamp: new Date().toISOString() };
  }
});

// API info (no tenant required)
app.get('/api/v1', async () => {
  return { message: 'Nase CMS API v1', version: '1.0.0' };
});

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

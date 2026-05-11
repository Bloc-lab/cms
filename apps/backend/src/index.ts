import './env.js';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { supabase } from './lib/supabase.js';
import tenantPlugin from './plugins/tenant.js';
import { contentPagesRoutes } from './routes/content/pages.js';
import { adminMediaRoutes } from './routes/admin/media.js';
import { adminContentRoutes } from './routes/admin/content.js';
import { adminContentDraftsRoutes } from './routes/admin/content-drafts.js';
import { adminPagesRoutes } from './routes/admin/pages.js';
import { publicSiteInfoRoutes } from './routes/public/site-info.js';
import { publicSiteSettingsRoutes } from './routes/public/site-settings.js';
import { publicLeadRoutes } from './routes/public/lead.js';
import { adminSiteSettingsRoutes } from './routes/admin/site-settings.js';
import { adminMeRoutes } from './routes/admin/me.js';
import { devTenantsRoutes } from './routes/dev/tenants.js';
import { platformTenantsRoutes } from './routes/platform/tenants.js';

const app = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function allowVercelPreviewOrigins(): boolean {
  const v = process.env.CORS_ALLOW_VERCEL_PREVIEW?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function isVercelAppOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === 'vercel.app' || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    if (corsOrigins.length === 0) {
      cb(null, true);
      return;
    }
    if (corsOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    if (allowVercelPreviewOrigins() && isVercelAppOrigin(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-Requested-With',
    'X-API-KEY',
    'X-Tenant-Host',
    'X-Tenant-Subdomain',
  ],
});

await app.register(tenantPlugin);
await app.register(contentPagesRoutes);
await app.register(publicSiteInfoRoutes);
await app.register(publicSiteSettingsRoutes);
await app.register(publicLeadRoutes);
await app.register(adminMediaRoutes);
await app.register(adminContentRoutes);
await app.register(adminContentDraftsRoutes);
await app.register(adminPagesRoutes);
await app.register(adminSiteSettingsRoutes);
await app.register(adminMeRoutes);
await app.register(devTenantsRoutes);
await app.register(platformTenantsRoutes);

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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const sharedSrcEntry = path.resolve(adminDir, '../../packages/shared/src/index.ts');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Dev and build resolve shared package from source (no manual `npm run build -w @nase-cms/shared`).
    alias: { '@nase-cms/shared': sharedSrcEntry },
  },
  server: {
    port: 5173,
    host: true,
    // allow subdomains like kadernictvi.admin.localhost and also admin.localhost
    allowedHosts: ['.localhost', '.admin.localhost', 'admin.localhost'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        // Must be false: otherwise the proxy rewrites Host to localhost:3000 and the tenant subdomain
        // (e.g. kadernictvi.localhost) is lost - the admin API returns 404 "Tenant subdomain required".
        changeOrigin: false,
        secure: false,
      },
    },
  },
});

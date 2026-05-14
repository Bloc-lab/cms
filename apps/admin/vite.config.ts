import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const sharedSrcEntry = path.resolve(adminDir, '../../packages/shared/src/index.ts');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Dev i build berou konfiguraci přímo ze zdroje shared (bez ručního `npm run build -w @nase-cms/shared`).
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
        // Musí být false: jinak proxy přepíše Host na localhost:3000 a tenant z subdomény
        // (kadernictvi.localhost) zmizí → admin API vrací 404 „Tenant subdomain required“.
        changeOrigin: false,
        secure: false,
      },
    },
  },
});

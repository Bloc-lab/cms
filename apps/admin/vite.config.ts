import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
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

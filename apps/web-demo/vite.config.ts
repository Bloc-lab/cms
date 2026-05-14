import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        // false = keep the browser Host (same as admin; content API uses X-API-KEY)
        changeOrigin: false,
        secure: false,
      },
    },
  },
});

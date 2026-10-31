import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Dev only: where the /api proxy sends requests (the local backend by default)
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Dev requests to /api are proxied to the backend, so no CORS or cookie issues locally
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
  };
});

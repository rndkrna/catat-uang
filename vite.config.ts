import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// SPA Fallback plugin - rewrite URL to / for SPA routes
const spaFallback = () => ({
  name: 'spa-fallback',
  enforce: 'pre',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const spaRoutes = ['/Syarat', '/login'];
      const urlPath = req.url.split('?')[0].split('#')[0];
      const isSpaRoute = spaRoutes.some(route => urlPath === route || urlPath.startsWith(route + '/'));
      
      if (isSpaRoute) {
        // Rewrite URL to / so Vite serves index.html
        req.url = '/';
      }
      next();
    });
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    publicDir: 'public',
    plugins: [react(), tailwindcss(), spaFallback()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/frontend'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});

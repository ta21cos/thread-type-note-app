import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: Switch configuration based on environment
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'development', '.', '');
  if (!env) {
    throw new Error('Env file is not loaded');
  }

  return {
    plugins: [react()],
    logLevel: 'info',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_API_ENDPOINT,
          changeOrigin: true,
        },
        '/ws': {
          target: env.VITE_BACKEND_WS_ENDPOINT,
          ws: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': '/src',
        '@shared': '/shared',
      },
    },
  };
});

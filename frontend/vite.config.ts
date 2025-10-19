import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: Switch configuration based on environment
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'development', '.', '');
  if (!env) {
    throw new Error('Env file is not loaded');
  }

  const port = mode === 'test' ? 5174 : 5173;

  return {
    plugins: [react()],
    logLevel: 'info',
    server: {
      port,
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

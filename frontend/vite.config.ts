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
      // NOTE: Proxy only needed for development (not production)
      ...(mode !== 'production' && {
        proxy: {
          '/api': {
            target: env.VITE_BACKEND_API_ENDPOINT,
            changeOrigin: true,
          },
          // NOTE: WebSocket proxy removed - using polling instead
        },
      }),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production', // NOTE: Only generate sourcemaps in dev/test
      minify: mode === 'production', // NOTE: Minify for production
      rollupOptions: {
        output: {
          manualChunks: {
            // NOTE: Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        '@shared': '/shared',
      },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/@firebase/firestore/') || normalizedId.includes('/firebase/firestore/')) {
              return 'firebase-firestore';
            }
            if (normalizedId.includes('/@firebase/auth/') || normalizedId.includes('/firebase/auth/')) {
              return 'firebase-auth';
            }
            if (normalizedId.includes('/@firebase/') || normalizedId.includes('/firebase/')) {
              return 'firebase-core';
            }
            if (normalizedId.includes('/recharts/') || normalizedId.includes('/d3-')) {
              return 'charts-vendor';
            }

            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
    },
  };
});

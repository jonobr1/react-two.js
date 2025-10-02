/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Configuration for documentation app build
export default defineConfig({
  plugins: [react()],
  base: '/react-two.js/', // GitHub Pages base path
  build: {
    outDir: 'docs-dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      'react-two.js': resolve(__dirname, 'lib/main.ts'),
    },
  },
  server: {
    port: 3000,
  },
});

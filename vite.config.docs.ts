/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Configuration for documentation app build
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      '@': resolve(__dirname, 'src'),
      'react-two.js': resolve(__dirname, 'lib/main.ts'),
    },
  },
  server: {
    port: 3000,
  },
});

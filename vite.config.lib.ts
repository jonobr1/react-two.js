/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// Configuration for library build
export default defineConfig({
  plugins: [react(), dts({ include: ['lib'] })],
  build: {
    copyPublicDir: false,
    lib: {
      name: 'react-two.js',
      entry: resolve(__dirname, 'lib/main.ts'),
      fileName: (format, entryName) => `react-two-${entryName}.${format}.js`,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'two.js'],
      output: {
        globals: {
          react: 'React',
          'two.js': 'Two',
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});

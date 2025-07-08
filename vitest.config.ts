/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: true,
    // Include simple tests for now
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['lib/**/*.test.{ts,tsx}'],
  },
});
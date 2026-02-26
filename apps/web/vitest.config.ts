import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
    reporters: process.env.CI
      ? [
          ['default', { summary: false }],
          ['junit', { outputFile: 'test-results.xml' }],
        ]
      : [['default', { summary: false }]],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10_000,
    hookTimeout: 15_000,
    css: false,
    sequence: {
      shuffle: !!process.env.CI,
    },
    coverage: {
      provider: 'v8',
      all: false,
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/components/erp/**',
        'src/features/**/forms/**',
        'src/providers/**',
      ],
      exclude: ['src/**/*.test.*', 'src/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});

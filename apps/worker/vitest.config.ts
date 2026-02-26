import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@afenda/finance/app': resolve(__dirname, 'src/__mocks__/finance-app.ts'),
    },
  },
  ssr: {
    resolve: {
      conditions: ['source', 'import', 'default'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
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
    sequence: {
      shuffle: !!process.env.CI,
    },
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});

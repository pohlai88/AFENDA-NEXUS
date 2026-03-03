import { defineConfig } from 'vitest/config';

export default defineConfig({
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
      exclude: ['src/**/*.test.ts', 'src/testing/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});

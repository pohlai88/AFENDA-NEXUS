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
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});

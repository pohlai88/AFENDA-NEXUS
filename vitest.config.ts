import { defineConfig } from 'vitest/config';

/**
 * Root Vitest config for @afenda monorepo.
 * Uses Vitest 3 `projects` (replaces deprecated workspace file).
 *
 * Run from root: pnpm exec vitest run
 * Run specific project: pnpm exec vitest run --project @afenda/web
 * Per-package: pnpm --filter @afenda/web test (uses package's own vitest.config.ts)
 */
export default defineConfig({
  test: {
    projects: [
      'packages/core',
      'packages/contracts',
      'packages/authz',
      'packages/db',
      'packages/modules/finance',
      'packages/platform',
      'packages/storage',
      'apps/worker',
      'apps/api',
      'apps/web',
    ],
  },
});

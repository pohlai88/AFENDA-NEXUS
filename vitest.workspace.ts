/**
 * Vitest workspace configuration for the @afenda monorepo.
 * Enables `vitest --project <name>` for focused local development.
 * CI still uses `turbo run test` for per-package parallelism.
 *
 * Usage: vitest --workspace vitest.workspace.ts --project finance
 */
export default [
  "packages/core",
  "packages/contracts",
  "packages/authz",
  "packages/db",
  "packages/modules/finance",
  "packages/platform",
  "apps/worker",
  "apps/api",
];

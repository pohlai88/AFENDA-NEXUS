import type { UserConfig } from "vitest/config";

/**
 * Shared Vitest configuration for all packages in the @afenda monorepo.
 * Import and spread into each package's vitest.config.ts.
 */
export const sharedTestConfig: UserConfig["test"] = {
  globals: true,
  environment: "node",
  reporters: process.env.CI
    ? [["default", { summary: false }], ["junit", { outputFile: "test-results.xml" }]]
    : [["default", { summary: false }]],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10_000,
  hookTimeout: 15_000,
};

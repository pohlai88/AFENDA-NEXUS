import { defineConfig } from "vitest/config";

export default defineConfig({
  ssr: {
    resolve: {
      conditions: ["source", "import", "default"],
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: process.env.CI
      ? [["default", { summary: false }], ["junit", { outputFile: "test-results.xml" }]]
      : [["default", { summary: false }]],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

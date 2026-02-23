/**
 * Vitest setup file — silences pino JSON output during test runs.
 *
 * Tests that explicitly need to verify log output should use
 * vi.stubEnv("LOG_LEVEL", "info") to override this default.
 */
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

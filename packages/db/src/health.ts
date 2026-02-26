/**
 * DB health check — verifies connectivity with a simple SELECT 1.
 *
 * Exported so apps/api can use it without importing drizzle-orm directly.
 * Uses retry on transient Neon errors (cold start, compute restart).
 */
import { sql } from 'drizzle-orm';
import type { DbClient } from './client.js';
import { withRetry } from './retry.js';

export function createHealthCheck(db: DbClient): () => Promise<void> {
  return async () => {
    await withRetry(() => db.execute(sql`SELECT 1`), { maxRetries: 2, baseDelayMs: 500 });
  };
}

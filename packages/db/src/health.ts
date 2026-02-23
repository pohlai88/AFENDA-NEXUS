/**
 * DB health check — verifies connectivity with a simple SELECT 1.
 *
 * Exported so apps/api can use it without importing drizzle-orm directly.
 */
import { sql } from "drizzle-orm";
import type { DbClient } from "./client.js";

export function createHealthCheck(db: DbClient): () => Promise<void> {
  return async () => {
    await db.execute(sql`SELECT 1`);
  };
}

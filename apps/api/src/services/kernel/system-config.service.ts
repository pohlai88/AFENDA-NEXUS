import type { DbClient } from '@afenda/db';
import { systemConfig } from '@afenda/db';
import { eq, sql } from 'drizzle-orm';
import { SystemConfigValueSchema, type SystemConfigValue } from '@afenda/contracts';

// ─── 60s TTL in-memory cache (spec §4.4) ─────────────────────────────────────
const configCache = new Map<string, { value: SystemConfigValue; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Read a system config value by key. Returns Zod-validated defaults if missing.
 * Cached with 60s TTL per key.
 */
export async function getSystemConfig(
  db: DbClient,
  key: string
): Promise<SystemConfigValue> {
  const cached = configCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const [row] = await db
    .select({ value: systemConfig.value })
    .from(systemConfig)
    .where(eq(systemConfig.key, key))
    .limit(1);

  const parsed = SystemConfigValueSchema.parse(row?.value ?? {});
  configCache.set(key, { value: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
  return parsed;
}

/**
 * Bust the system config cache for a specific key (or all keys).
 */
export function bustSystemConfigCache(key?: string): void {
  if (key) {
    configCache.delete(key);
  } else {
    configCache.clear();
  }
}

/**
 * List all system config entries.
 */
export async function listSystemConfig(
  db: DbClient
): Promise<Array<{ key: string; value: SystemConfigValue; updatedAt: Date }>> {
  const rows = await db
    .select({
      key: systemConfig.key,
      value: systemConfig.value,
      updatedAt: systemConfig.updatedAt,
    })
    .from(systemConfig);

  return rows.map((r) => ({
    key: r.key,
    value: SystemConfigValueSchema.parse(r.value),
    updatedAt: r.updatedAt,
  }));
}

/**
 * Set a system config value. Upserts the row.
 * I-KRN-07: all admin mutations are double-logged (caller logs to admin_action_log).
 */
export async function setSystemConfig(
  db: DbClient,
  key: string,
  value: SystemConfigValue,
  actorUserId: string
): Promise<void> {
  const validated = SystemConfigValueSchema.parse(value);

  await db
    .insert(systemConfig)
    .values({
      key,
      value: validated as unknown as Record<string, unknown>,
      updatedBy: actorUserId,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: {
        value: validated as unknown as Record<string, unknown>,
        updatedBy: actorUserId,
        updatedAt: sql`now()`,
      },
    });
}

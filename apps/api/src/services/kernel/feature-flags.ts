import type { DbClient } from '@afenda/db';
import { getSystemConfig } from './system-config.service.js';

/**
 * Feature flag key in system_config table.
 */
const FEATURE_FLAGS_KEY = 'feature_flags';

/**
 * In-memory cache for feature flags (60s TTL).
 */
let cachedFlags: Record<string, boolean> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Resolve feature flags from DB system_config + env overrides.
 * I-KRN-09: env always wins over DB values.
 *
 * DB format: system_config key='feature_flags', value={ "flagName": true/false }
 * Env format: FEATURE_FLAG_<UPPER_SNAKE> = 'true' | 'false'
 *
 * Returns merged record of flag name → boolean.
 */
export async function featureFlags(
  db: DbClient
): Promise<Record<string, boolean>> {
  const now = Date.now();

  // Check cache
  if (cachedFlags && now - cacheTimestamp < CACHE_TTL_MS) {
    return applyEnvOverrides(cachedFlags);
  }

  // Read from DB
  const dbValue = await getSystemConfig(db, FEATURE_FLAGS_KEY);

  const dbFlags: Record<string, boolean> = {};
  if (dbValue && typeof dbValue === 'object' && !Array.isArray(dbValue)) {
    for (const [k, v] of Object.entries(dbValue as Record<string, unknown>)) {
      if (typeof v === 'boolean') {
        dbFlags[k] = v;
      }
    }
  }

  // Update cache
  cachedFlags = dbFlags;
  cacheTimestamp = now;

  return applyEnvOverrides(dbFlags);
}

/**
 * I-KRN-09: Environment overrides always win.
 * Scans process.env for FEATURE_FLAG_* variables.
 * Converts FEATURE_FLAG_SOME_FLAG → someFlag.
 */
function applyEnvOverrides(
  flags: Record<string, boolean>
): Record<string, boolean> {
  const merged = { ...flags };

  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (!envKey.startsWith('FEATURE_FLAG_') || envVal === undefined) continue;

    // FEATURE_FLAG_SOME_FLAG → someFlag
    const flagName = envKey
      .slice('FEATURE_FLAG_'.length)
      .toLowerCase()
      .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

    merged[flagName] = envVal === 'true' || envVal === '1';
  }

  return merged;
}

/**
 * Bust the feature flags cache. Call after system_config update.
 */
export function bustFeatureFlagsCache(): void {
  cachedFlags = null;
  cacheTimestamp = 0;
}

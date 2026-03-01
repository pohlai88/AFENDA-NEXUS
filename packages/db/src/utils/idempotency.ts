import { createHash } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { seedRun } from '../schema/platform.js';

export interface SeedRunConfig {
  depth: 'minimal' | 'standard' | 'comprehensive';
  seed: number;
  months: number;
  scenarios: string[];
  version: string;
}

/**
 * Calculates SHA256 hash of seed configuration for idempotency checking.
 * Same config = same hash, ensuring deterministic seeding.
 */
export function calculateSeedHash(config: SeedRunConfig): string {
  // Sort keys for consistent hashing
  const data = JSON.stringify(config, Object.keys(config).sort());
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Checks if seed should run based on seed registry.
 * Returns false if same config was already executed (idempotency).
 * 
 * @param db - Database client
 * @param seedKey - Logical seed identifier (e.g. 'demo:v1')
 * @param currentConfig - Current seed configuration
 * @param branchName - Neon branch name (from detectNeonBranch)
 * @param tenantId - Optional tenant ID for tenant-specific seeding
 */
export async function shouldRunSeed(
  db: DbClient,
  seedKey: string,
  currentConfig: SeedRunConfig,
  branchName: string,
  tenantId?: string
): Promise<{ run: boolean; reason: string }> {
  const currentHash = calculateSeedHash(currentConfig);
  
  // Query with composite key: (seed_key, branch_name, tenant_id)
  const existing = await db
    .select()
    .from(seedRun)
    .where(
      and(
        eq(seedRun.seedKey, seedKey),
        eq(seedRun.branchName, branchName),
        tenantId ? eq(seedRun.tenantId, tenantId) : isNull(seedRun.tenantId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return { run: true, reason: `First run for branch: ${branchName}` };
  }
  
  const record = existing[0];
  if (!record) {
    return { run: true, reason: `First run for branch: ${branchName}` };
  }
  
  if (record.seedHash !== currentHash) {
    const diff = diffConfig(
      { 
        depth: record.depth as 'standard' | 'minimal' | 'comprehensive', 
        months: record.months, 
        scenarios: record.scenarios as string[] 
      },
      { depth: currentConfig.depth, months: currentConfig.months, scenarios: currentConfig.scenarios }
    );
    return { 
      run: false, 
      reason:
        `Config changed. Use --reset to force reseed.\n` +
        `Previous: ${record.seedHash} (seeded ${record.seededAt.toISOString()})\n` +
        `Current:  ${currentHash}\n` +
        `Changed: ${diff}`
    };
  }

  return { 
    run: false, 
    reason: `Already seeded on ${record.seededAt.toISOString()} with same config` 
  };
}

/**
 * Records seed run in registry for idempotency tracking.
 * Uses upsert to handle re-seeding (--reset flag).
 */
export async function recordSeedRun(
  db: DbClient,
  seedKey: string,
  config: SeedRunConfig,
  branchName: string,
  tenantId?: string
): Promise<void> {
  const seedHash = calculateSeedHash(config);
  
  await db.insert(seedRun).values({
    seedKey,
    branchName,
    tenantId: tenantId || null,
    seedHash,
    seedVersion: config.version,
    depth: config.depth,
    months: config.months,
    scenarios: config.scenarios,
    seededAt: new Date(),
  }).onConflictDoUpdate({
    target: [seedRun.seedKey, seedRun.branchName, seedRun.tenantId],
    set: {
      seedHash,
      seedVersion: config.version,
      depth: config.depth,
      months: config.months,
      scenarios: config.scenarios,
      seededAt: new Date(),
    },
  });
}

/**
 * Helper to generate human-readable diff of config changes.
 */
function diffConfig(
  prev: Pick<SeedRunConfig, 'depth' | 'months' | 'scenarios'>,
  curr: Pick<SeedRunConfig, 'depth' | 'months' | 'scenarios'>
): string {
  const changes: string[] = [];
  
  if (prev.depth !== curr.depth) {
    changes.push(`depth: ${prev.depth} → ${curr.depth}`);
  }
  if (prev.months !== curr.months) {
    changes.push(`months: ${prev.months} → ${curr.months}`);
  }
  const prevScenarios = prev.scenarios.sort().join(',');
  const currScenarios = curr.scenarios.sort().join(',');
  if (prevScenarios !== currScenarios) {
    changes.push(`scenarios: [${prevScenarios}] → [${currScenarios}]`);
  }
  
  return changes.length > 0 ? changes.join(', ') : 'unknown';
}

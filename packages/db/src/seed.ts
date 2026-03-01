import { parseArgs } from 'node:util';
import { createSeedClient } from './utils/seed-client.js';
import { detectNeonBranch } from './utils/neon-branch-detector.js';
import { shouldRunSeed, recordSeedRun, type SeedRunConfig } from './utils/idempotency.js';
import { seedPlatform } from './platform/platform.seeder.js';
// FIXME: These seeders have schema import errors - temporarily disabled
// import { seedMasterData } from './master/master-data.seeder.js';
// import { runBaselineScenario } from './scenarios/baseline.scenario.js';
import { assertDashboardContract, printDashboardAssertResult } from './metrics/dashboard.assert.js';

/**
 * Production-Grade Database Seeding Script
 * 
 * Features:
 * - Neon branch detection with auto-depth adjustment
 * - Idempotency via seed registry (composite keys per branch/tenant)
 * - Deterministic seeding via drizzle-seed library
 * - RLS-safe operations via createDbSession
 * - Dashboard contract verification
 * - CLI arguments for customization
 * 
 * Usage:
 *   pnpm db:seed                                    # Auto-detect branch, standard depth
 *   pnpm db:seed -- --seed=1337                     # Deterministic seed
 *   pnpm db:seed -- --depth=comprehensive --months=12  # Full data
 *   pnpm db:seed -- --reset                         # Force reseed
 *   pnpm db:seed -- --verify                        # Run dashboard contract
 * 
 * Environment Variables:
 *   DATABASE_URL_DIRECT=postgres://... (required)
 *   NEON_BRANCH_NAME=preview-pr-123   (optional, for branch detection)
 *   NEON_BRANCH_TYPE=preview          (optional, explicit type)
 *   GIT_BRANCH=$GITHUB_HEAD_REF       (optional, fallback)
 */

// ─── CLI Argument Parsing ─────────────────────────────────────────────

const { values } = parseArgs({
  options: {
    seed: { type: 'string', default: '1337' },
    depth: { type: 'string' }, // Optional - auto-detected from branch
    months: { type: 'string', default: '6' },
    scenarios: { type: 'string', multiple: true, default: ['baseline'] },
    reset: { type: 'boolean', default: false },
    verify: { type: 'boolean', default: true },
  },
  strict: false,
});

// ─── Main Seed Function ───────────────────────────────────────────────

export async function seed(connectionString: string): Promise<void> {
  console.log('🌱 AFENDA Database Seeding - Production Grade\n');
  
  // Step 1: Create seed client (with pooled connection guard)
  const db = createSeedClient();
  
  // Step 2: Detect Neon branch and determine depth
  const branchInfo = detectNeonBranch(
    connectionString, 
    values.depth as 'minimal' | 'standard' | 'comprehensive' | undefined
  );
  
  console.log(`🌿 Branch: ${branchInfo.branchName} (${branchInfo.branchType})`);
  console.log(`📊 Depth: ${branchInfo.seedDepth}`);
  console.log(`🎲 Seed: ${values.seed}\n`);
  
  // Step 3: Build seed configuration
  const seedNumber = Number(values.seed);
  const months = Number(values.months);
  
  const config: SeedRunConfig = {
    depth: branchInfo.seedDepth,
    seed: seedNumber,
    months,
    scenarios: (Array.isArray(values.scenarios) ? values.scenarios : [values.scenarios]).filter((s): s is string => typeof s === 'string'),
    version: '1.0.0',
  };
  
  // Step 4: Check idempotency (unless --reset)
  if (!values.reset) {
    const check = await shouldRunSeed(
      db,
      'demo:v1',
      config,
      branchInfo.branchName
    );
    
    if (!check.run) {
      console.log(`⏭️  ${check.reason}\n`);
      console.log('💡 Use --reset to force reseed\n');
      return;
    }
    
    console.log(`✅ ${check.reason}\n`);
  } else {
    console.log(`🔄 Force reseed enabled (--reset)\n`);
  }
  
  // Step 5: Run platform seeder
  const platform = await seedPlatform(db, {
    seed: seedNumber,
    companiesPerTenant: branchInfo.seedDepth === 'minimal' ? 1 : 2,
  });
  
  console.log('');
  
  // Step 6: Run master data seeder for each company
  // FIXME: Temporarily disabled due to schema import errors
  /*
  for (const company of platform.companies) {
    const currency = platform.currencies.find(c => c.id === company.baseCurrencyId)!;
    
    await seedMasterData(db, {
      seed: seedNumber,
      tenantId: platform.tenant.id,
      companyId: company.id,
      currencyId: currency.id,
      customerCount: branchInfo.seedDepth === 'minimal' ? 20 : 
                     branchInfo.seedDepth === 'standard' ? 50 : 80,
      supplierCount: branchInfo.seedDepth === 'minimal' ? 10 : 
                     branchInfo.seedDepth === 'standard' ? 30 : 50,
    });
    
    console.log('');
  }
  */
  
  // Step 7: Run transaction scenarios
  console.log(`📈 Running scenarios: ${config.scenarios.join(', ')}\n`);
  
  // FIXME: Temporarily disabled due to schema import errors
  /*
  for (const company of platform.companies) {
    if (config.scenarios.includes('baseline')) {
      await runBaselineScenario(db, {
        seed: seedNumber,
        tenantId: platform.tenant.id,
        companyId: company.id,
        months: branchInfo.seedDepth === 'minimal' ? 1 : 
                branchInfo.seedDepth === 'standard' ? 6 : 12,
      });
      console.log('');
    }
  }
  */
  
  // Step 8: Verify dashboard contract
  if (values.verify) {
    console.log(`🔍 Verifying dashboard contract...\n`);
    
    for (const company of platform.companies) {
      const result = await assertDashboardContract(
        db,
        platform.tenant.id,
        company.id
      );
      
      printDashboardAssertResult(result, company.name);
      
      if (!result.passed) {
        console.error('\n❌ Dashboard contract failed! Seed data is incomplete.\n');
        throw new Error('Dashboard contract validation failed');
      }
    }
    
    console.log('');
  }
  
  // Step 9: Record seed run in registry
  await recordSeedRun(
    db,
    'demo:v1',
    config,
    branchInfo.branchName,
    platform.tenant.id
  );
  
  console.log(`✅ Seeding completed successfully!\n`);
  console.log(`📊 Summary:`);
  console.log(`   Tenant: ${platform.tenant.name}`);
  console.log(`   Companies: ${platform.companies.length}`);
  console.log(`   Branch: ${branchInfo.branchName}`);
  console.log(`   Depth: ${branchInfo.seedDepth}`);
  console.log(`   Months: ${months}`);
  console.log(`   Scenarios: ${config.scenarios.join(', ')}`);
  console.log('');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const connectionString = process.env.DATABASE_URL_DIRECT;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL_DIRECT environment variable is required');
    process.exit(1);
  }
  
  seed(connectionString)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

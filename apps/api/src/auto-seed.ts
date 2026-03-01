import type { Logger } from '@afenda/platform';
import { seed, detectNeonBranch, shouldRunSeed, createSeedClient, type SeedRunConfig } from '@afenda/db';

/**
 * Auto-seeds database on API startup when ALL conditions are met:
 * 
 * 1. NODE_ENV=development
 * 2. AFENDA_AUTO_SEED=1 (explicit opt-in)
 * 3. Non-production database (localhost OR Neon non-main branch)
 * 4. No existing seed_run record for current branch
 * 
 * This prevents accidental seeding in production while enabling seamless
 * local development and preview branch workflows.
 */
export async function autoSeedIfNeeded(logger: Logger): Promise<void> {
  // Guard 1: Only in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Guard 2: Explicit opt-in required
  if (process.env.AFENDA_AUTO_SEED !== '1') {
    return;
  }
  
  const connectionString = process.env.DATABASE_URL_DIRECT;
  
  if (!connectionString) {
    logger.warn('Auto-seed skipped: DATABASE_URL_DIRECT not set');
    return;
  }
  
  try {
    // Guard 3: Non-production database check
    const branchInfo = detectNeonBranch(connectionString);
    const isLocalhost = connectionString.includes('localhost') || 
                         connectionString.includes('127.0.0.1');
    const isNonProdBranch = branchInfo.isNeonBranch && branchInfo.branchType !== 'main';
    
    if (!isLocalhost && !isNonProdBranch) {
      logger.warn('Auto-seed skipped: Production database detected');
      return;
    }
    
    // Guard 4: Check if already seeded
    const db = createSeedClient();
    const config: SeedRunConfig = {
      depth: branchInfo.seedDepth,
      seed: 1337,
      months: branchInfo.seedDepth === 'minimal' ? 1 : 6,
      scenarios: ['baseline'],
      version: '1.0.0',
    };
    
    const shouldSeed = await shouldRunSeed(
      db,
      'demo:v1',
      config,
      branchInfo.branchName
    );
    
    if (!shouldSeed.run) {
      logger.info(
        `Auto-seed skipped: ${shouldSeed.reason}`,
        { branch: branchInfo.branchName }
      );
      return;
    }
    
    // All guards passed - run seed
    logger.info(
      `🌱 Auto-seeding database (branch: ${branchInfo.branchName}, depth: ${branchInfo.seedDepth})...`
    );
    
    await seed(connectionString);
    
    logger.info('✅ Auto-seed completed successfully');
  } catch (error) {
    logger.error(
      'Auto-seed failed (continuing startup)',
      { error: error instanceof Error ? error.message : String(error) }
    );
    // Don't throw - allow API to start even if seeding fails
  }
}

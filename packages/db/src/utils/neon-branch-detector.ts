export interface NeonBranchInfo {
  isNeonBranch: boolean;
  branchType: 'main' | 'dev' | 'preview' | 'test';
  branchName: string;
  seedDepth: 'minimal' | 'standard' | 'comprehensive';
}

/**
 * Detects Neon branch from environment variables (NOT connection string parsing).
 * 
 * Priority:
 * 1. Explicit env vars: NEON_BRANCH_NAME, NEON_BRANCH_TYPE
 * 2. Git branch: GIT_BRANCH
 * 3. Default: 'main'
 * 
 * Branch-specific seeding depth:
 * - main: comprehensive (12 months, all scenarios)
 * - test: standard (6 months, baseline + late-payments)
 * - dev/preview: minimal (1 month, baseline only)
 * 
 * @param connectionString - Database connection string (for pooled check only)
 * @param userDepth - Optional depth override from CLI
 * @throws {Error} If connection string contains '-pooler' (pooled connection)
 */
export function detectNeonBranch(
  connectionString: string,
  userDepth?: 'minimal' | 'standard' | 'comprehensive'
): NeonBranchInfo {
  // Priority 1: Explicit env vars (most reliable for CI/CD, Vercel, GitHub Actions)
  const envBranchName = process.env.NEON_BRANCH_NAME || process.env.GIT_BRANCH || 'main';
  const envBranchType = process.env.NEON_BRANCH_TYPE as 'main' | 'dev' | 'preview' | 'test' | undefined;
  
  // Priority 2: Hard-fail on pooled connection (safety check)
  const url = new URL(connectionString);
  if (url.hostname.includes('-pooler')) {
    throw new Error(
      'Cannot use pooled connection for seeding.\n' +
      'Use DATABASE_URL_DIRECT (without -pooler) instead.\n' +
      `Current hostname: ${url.hostname}\n` +
      'Update your .env file to use the direct connection string from Neon.'
    );
  }
  
  // Determine branch type from name or explicit env
  let branchType: 'main' | 'dev' | 'preview' | 'test';
  if (envBranchType) {
    branchType = envBranchType;
  } else if (envBranchName.startsWith('preview-') || envBranchName.startsWith('pr-')) {
    branchType = 'preview';
  } else if (envBranchName.startsWith('test-') || envBranchName.startsWith('ci-')) {
    branchType = 'test';
  } else if (envBranchName === 'main' || envBranchName === 'production') {
    branchType = 'main';
  } else {
    branchType = 'dev';
  }
  
  // Auto-depth based on branch type
  const autoDepth: Record<typeof branchType, 'minimal' | 'standard' | 'comprehensive'> = {
    main: 'comprehensive',
    test: 'standard',
    dev: 'minimal',
    preview: 'minimal',
  };
  
  return {
    isNeonBranch: url.hostname.includes('.neon.tech'),
    branchType,
    branchName: envBranchName,
    seedDepth: userDepth || autoDepth[branchType], // User override takes precedence
  };
}

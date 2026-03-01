# Database Seeding - Implementation Reference

**Status**: Implementation Plan - Ready for Development  
**Last Updated**: 2026-03-01  
**Plan Document**: [Database Seeding Strategy](../../.cursor/plans/database_seeding_strategy_ef814868.plan.md)

---

## Codebase Directory Structure & Exact File Paths

### 1. Existing Files (DO NOT MODIFY - Reference Only)

#### Core Database Infrastructure
```
packages/db/src/
├── client.ts                     ✅ EXISTS - Exports createDirectClient(), createPooledClient()
├── session.ts                    ✅ EXISTS - Exports createDbSession() with RLS wrappers
├── seed.ts                       📝 ENHANCE - Current basic seed (227 lines)
├── migrate.ts                    ✅ EXISTS - Migration runner
├── index.ts                      ✅ EXISTS - Main exports
└── schema/
    ├── platform.ts               📝 ENHANCE - Add seedRun table
    ├── erp.ts                    ✅ EXISTS - All ERP tables
    ├── index.ts                  ✅ EXISTS - Schema exports
    └── ...
```

#### Domain Services (Import Only)
```
packages/modules/finance/src/slices/
├── ap/services/
│   └── post-ap-invoice.ts        ✅ EXISTS - Export: postApInvoice()
├── ar/services/
│   └── post-ar-invoice.ts        ✅ EXISTS - Export: postArInvoice()
└── gl/services/
    ├── post-journal.ts           ✅ EXISTS - Export: postJournal()
    └── create-journal.ts         ✅ EXISTS - Export: createJournal()
```

#### Dashboard Queries (Import for Contract Assertions)
```
apps/web/src/features/finance/dashboard/queries/
├── dashboard.queries.ts          ✅ EXISTS - Export: getDashboardKPIs(), getCashFlowChart()
└── new-charts.queries.ts         ✅ EXISTS - Export: Additional queries
```

### 2. Files to Create

#### Migrations
```
packages/db/drizzle/
└── 0999_seed_registry.sql        🆕 CREATE - Seed registry table migration
```

#### Utilities (New Folder)
```
packages/db/src/utils/            🆕 CREATE FOLDER
├── neon-branch-detector.ts       🆕 CREATE - Env-based branch detection (~80 lines)
├── seed-client.ts                🆕 CREATE - Pooled connection guard (~30 lines)
├── idempotency.ts                🆕 CREATE - Composite key logic (~100 lines)
└── business-keys.ts              🆕 CREATE - Deterministic key generation (~50 lines)
```

#### Platform Seeders (drizzle-seed)
```
packages/db/src/platform/         🆕 CREATE FOLDER
├── tenants.seeder.ts             🆕 CREATE - Tenant generation (~80 lines)
├── companies.seeder.ts           🆕 CREATE - Company generation (~100 lines)
├── users.seeder.ts               🆕 CREATE - User generation (~120 lines)
└── currencies.seeder.ts          🆕 CREATE - Currency generation (~60 lines)
```

#### Master Data Seeders (drizzle-seed)
```
packages/db/src/master/           🆕 CREATE FOLDER
├── customers.seeder.ts           🆕 CREATE - Customer generation (~150 lines)
├── suppliers.seeder.ts           🆕 CREATE - Supplier generation (~150 lines)
├── coa.seeder.ts                 🆕 CREATE - Enhanced COA (~200 lines)
├── tax-codes.seeder.ts           🆕 CREATE - Tax code generation (~100 lines)
├── banks.seeder.ts               🆕 CREATE - Bank account generation (~80 lines)
└── payment-terms.seeder.ts       🆕 CREATE - Payment terms (~60 lines)
```

#### Transaction Scenarios (Domain Services)
```
packages/db/src/scenarios/        🆕 CREATE FOLDER
├── baseline.scenario.ts          🆕 CREATE - Steady operations (~300 lines)
├── late-payments.scenario.ts     🆕 CREATE - DSO worsening (~250 lines)
├── fx-volatility.scenario.ts     🆕 CREATE - FX gains/losses (~200 lines)
└── growth.scenario.ts            🆕 CREATE - Revenue growth (~250 lines)
```

#### Dashboard Contract & Assertions
```
packages/db/src/metrics/          🆕 CREATE FOLDER
├── dashboard.contract.ts         🆕 CREATE - Interface definitions (~100 lines)
└── dashboard.assert.ts           🆕 CREATE - Verification logic (~300 lines)
```

#### Tests
```
packages/db/src/__tests__/
├── seed.test.ts                  📝 EXISTS - Enhance with contract checks
├── invariants.test.ts            🆕 CREATE - Balanced journals, AR/AP integrity (~200 lines)
└── rls-isolation.test.ts         🆕 CREATE - Sentinel test (~100 lines)
```

#### Documentation
```
packages/db/
├── README.md                     📝 UPDATE - Add seeding section
└── docs/
    ├── SEEDING-GUIDE.md          🆕 CREATE - Usage guide (~400 lines)
    ├── SEEDING-ARCHITECTURE.md   🆕 CREATE - Implementation docs (~600 lines)
    ├── NEON-DRIZZLE-BEST-PRACTICES.md  ✅ EXISTS - Reference
    └── NEON-INTEGRATION.md       ✅ EXISTS - Reference
```

---

## File Content Templates

### 1. Seed Registry Migration

**File**: `packages/db/drizzle/0999_seed_registry.sql`

```sql
-- Seed Run Registry (Composite Uniqueness)
CREATE TABLE IF NOT EXISTS platform.seed_run (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  seed_key TEXT NOT NULL,
  branch_name TEXT NOT NULL DEFAULT 'main',
  tenant_id UUID REFERENCES platform.tenant(id),
  seed_hash TEXT NOT NULL,
  seed_version TEXT NOT NULL,
  depth TEXT NOT NULL,
  months INTEGER NOT NULL,
  scenarios JSONB NOT NULL,
  created_by TEXT,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT uq_seed_run_key_branch_tenant UNIQUE (seed_key, branch_name, tenant_id)
);

CREATE INDEX idx_seed_run_branch ON platform.seed_run(branch_name);
CREATE INDEX idx_seed_run_tenant ON platform.seed_run(tenant_id) WHERE tenant_id IS NOT NULL;

COMMENT ON TABLE platform.seed_run IS 'Tracks database seeding runs for idempotency (per branch/tenant)';
COMMENT ON COLUMN platform.seed_run.seed_key IS 'Logical seed identifier (e.g. demo:v1)';
COMMENT ON COLUMN platform.seed_run.branch_name IS 'Neon branch name (from NEON_BRANCH_NAME env)';
COMMENT ON COLUMN platform.seed_run.tenant_id IS 'NULL for system seeds, tenant-specific otherwise';
COMMENT ON COLUMN platform.seed_run.seed_hash IS 'SHA256 hash of config (depth/months/scenarios/version)';
```

### 2. Seed Registry Schema

**File**: `packages/db/src/schema/platform.ts` (ADD TO EXISTING FILE)

```typescript
// Add after existing table definitions
export const seedRun = platformSchema.table('seed_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  seedKey: text('seed_key').notNull(),
  branchName: text('branch_name').notNull().default('main'),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  seedHash: text('seed_hash').notNull(),
  seedVersion: text('seed_version').notNull(),
  depth: text('depth').notNull(),
  months: integer('months').notNull(),
  scenarios: jsonb('scenarios').$type<string[]>().notNull(),
  createdBy: text('created_by'),
  seededAt: timestamp('seeded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqKeyBranchTenant: uniqueIndex('uq_seed_run_key_branch_tenant')
    .on(table.seedKey, table.branchName, table.tenantId),
  idxBranch: index('idx_seed_run_branch').on(table.branchName),
  idxTenant: index('idx_seed_run_tenant').on(table.tenantId)
    .where(sql`${table.tenantId} IS NOT NULL`),
}));
```

### 3. Neon Branch Detector

**File**: `packages/db/src/utils/neon-branch-detector.ts`

```typescript
export interface NeonBranchInfo {
  isNeonBranch: boolean;
  branchType: 'main' | 'dev' | 'preview' | 'test';
  branchName: string;
  seedDepth: 'minimal' | 'standard' | 'comprehensive';
}

export function detectNeonBranch(
  connectionString: string,
  userDepth?: 'minimal' | 'standard' | 'comprehensive'
): NeonBranchInfo {
  // Priority 1: Explicit env vars (most reliable)
  const envBranchName = process.env.NEON_BRANCH_NAME || process.env.GIT_BRANCH || 'main';
  const envBranchType = process.env.NEON_BRANCH_TYPE as 'main' | 'dev' | 'preview' | 'test' | undefined;
  
  // Priority 2: Hard-fail on pooled connection
  const url = new URL(connectionString);
  if (url.hostname.includes('-pooler')) {
    throw new Error(
      'Cannot use pooled connection for seeding.\n' +
      'Use DATABASE_URL_DIRECT (without -pooler) instead.\n' +
      `Current hostname: ${url.hostname}`
    );
  }
  
  // Determine branch type from name
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
  const autoDepth = {
    main: 'comprehensive',
    test: 'standard',
    dev: 'minimal',
    preview: 'minimal',
  }[branchType] as 'minimal' | 'standard' | 'comprehensive';
  
  return {
    isNeonBranch: url.hostname.includes('.neon.tech'),
    branchType,
    branchName: envBranchName,
    seedDepth: userDepth || autoDepth,
  };
}
```

### 4. Seed Client with Guard

**File**: `packages/db/src/utils/seed-client.ts`

```typescript
import { createDirectClient } from '../client';

export function createSeedClient() {
  const connectionString = process.env.DATABASE_URL_DIRECT;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL_DIRECT is required for seeding and migrations.\n' +
      'Set it to your Neon direct (non-pooled) connection string.'
    );
  }
  
  // Hard-fail if pooled connection detected
  const url = new URL(connectionString);
  if (url.hostname.includes('-pooler')) {
    throw new Error(
      'Cannot use pooled connection for seeding.\n' +
      'DATABASE_URL_DIRECT must be a direct connection (without -pooler).\n' +
      `Current hostname: ${url.hostname}`
    );
  }
  
  return createDirectClient({ connectionString });
}
```

---

## Import Patterns

### Using Existing createDbSession (RLS-Safe)

```typescript
import { createDbSession } from '@afenda/db/session';
import { createSeedClient } from './utils/seed-client';

const db = createSeedClient();
const session = createDbSession({ db });

// Platform data (no RLS needed)
const [tenant] = await db.insert(tenants).values({...}).returning();

// Tenant-scoped data
await session.withTenant({ tenantId: tenant.id }, async (tx) => {
  const companies = await tx.insert(companies).values([...]).returning();
  // All operations here have app.tenant_id set
});

// Company-scoped data
await session.withTenantAndCompany(
  { tenantId: tenant.id, companyId: company.id },
  async (tx) => {
    // All operations here have app.tenant_id AND app.company_id set
    await seed(tx, { suppliers }, { count: 50, seed: options.seed });
  }
);
```

### Using drizzle-seed

```typescript
import { seed } from 'drizzle-seed';
import { suppliers, customers } from '@afenda/db/schema/erp';

// Inside withTenantAndCompany transaction
await seed(tx, { suppliers }, { 
  count: 50, 
  seed: options.seed 
});

await seed(tx, { customers }, { 
  count: 80, 
  seed: options.seed 
});
```

### Calling Domain Services

```typescript
import { postApInvoice } from '@afenda/modules/finance/ap';
import { postArInvoice } from '@afenda/modules/finance/ar';
import { postJournal } from '@afenda/modules/finance/gl';

// Create AP invoice and post to GL
for (const invoiceData of generatedInvoices) {
  await postApInvoice(
    {
      invoiceId: invoiceData.id,
      fiscalPeriodId: period.id,
      apAccountId: apControlAccount.id,
      correlationId: `seed-${invoiceData.id}`,
    },
    {
      apInvoiceRepo,
      journalRepo,
      outboxWriter,
      documentNumberGenerator,
      idempotencyStore,
      fiscalPeriodRepo,
    },
    { tenantId, actor: { userId: adminUserId } }
  );
}
```

---

## Environment Variables

```bash
# Required
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xyz.neon.tech/dbname?sslmode=require

# Neon Branch Detection (set in CI/CD, Vercel, GitHub Actions)
NEON_BRANCH_NAME=preview-pr-123     # Explicit branch name
NEON_BRANCH_TYPE=preview            # Optional: main|dev|preview|test
GIT_BRANCH=$GITHUB_HEAD_REF         # Alternative: use Git branch name

# Auto-Seed Guards
NODE_ENV=development
AFENDA_AUTO_SEED=1                  # Enable auto-seed

# RLS
RLS_ENFORCED=true                   # Default: true
```

---

## CLI Commands

```bash
# Standard seeding (auto-detects Neon branch)
pnpm --filter @afenda/db db:seed

# Specify deterministic seed
pnpm db:seed -- --seed=1337

# Comprehensive data (12 months)
pnpm db:seed -- --depth=comprehensive --months=12

# Multiple scenarios
pnpm db:seed -- --scenarios=baseline --scenarios=late-payments

# Force reseed (ignores hash check)
pnpm db:seed -- --reset

# Verify dashboard contract
pnpm db:seed -- --verify

# Override branch detection
NEON_BRANCH_NAME=test-branch pnpm db:seed
```

---

## Post-Implementation: Create Architecture Documentation

### Required File: `packages/db/docs/SEEDING-ARCHITECTURE.md`

**Template Structure**:

```markdown
# Database Seeding Architecture

## Overview
[High-level description of seeding system]

## System Architecture
[Mermaid diagram showing components and data flow]

## Component Responsibilities

### Platform Seeders
- **Purpose**: Create tenant, company, user, currency foundation
- **Technology**: drizzle-seed for deterministic generation
- **Files**: packages/db/src/platform/*.seeder.ts
- **RLS**: No tenant context needed (platform schema)

### Master Data Seeders
- **Purpose**: Create suppliers, customers, COA, tax codes
- **Technology**: drizzle-seed for realistic data
- **Files**: packages/db/src/master/*.seeder.ts
- **RLS**: Uses createDbSession.withTenantAndCompany()

### Transaction Scenarios
- **Purpose**: Create realistic business transactions
- **Technology**: Domain services (postApInvoice, postArInvoice, postJournal)
- **Files**: packages/db/src/scenarios/*.scenario.ts
- **RLS**: Always through domain services (enforce invariants)

## Neon Integration

### Branch Detection
[How NEON_BRANCH_NAME and GIT_BRANCH are used]

### Depth Strategy
- **main**: comprehensive (12 months, all scenarios)
- **test**: standard (6 months, baseline + late-payments)
- **dev/preview**: minimal (1 month, baseline only)

## Data Flow

1. CLI invokes seed.ts with options
2. Branch detection determines depth
3. Seed registry check for idempotency
4. Platform seeders create foundation
5. Master data seeders populate catalogs
6. Scenarios call domain services for transactions
7. Dashboard contract verifies coverage
8. Record seed run in registry

## RLS Safety

[Explain how createDbSession ensures isolation]

## Idempotency

[Seed registry design with composite keys]

## Dashboard Contract

[How assertions guarantee all 8 charts have data]

## Testing Strategy

[Invariant tests, RLS tests, dashboard tests]

## Usage Examples

[Common CLI commands and workflows]

## Maintenance

[How to add new seeders/scenarios]

## Troubleshooting

[Common issues and solutions]
```

### Update: `packages/db/README.md`

Add seeding section after existing content:

```markdown
## Database Seeding

### Quick Start
```bash
# Seed with defaults
pnpm db:seed

# Reproducible seeding
pnpm db:seed -- --seed=1337

# Comprehensive data
pnpm db:seed -- --depth=comprehensive --months=12
```

### Features
- ✅ Deterministic with drizzle-seed
- ✅ Neon branch-aware
- ✅ RLS-safe transactions
- ✅ Dashboard contract verification
- ✅ Domain service integration

### Documentation
- [Seeding Guide](./docs/SEEDING-GUIDE.md)
- [Seeding Architecture](./docs/SEEDING-ARCHITECTURE.md)
```

---

## Development Workflow

1. **Test Locally**: `pnpm db:seed -- --seed=1337 --verify`
2. **Verify Dashboard**: Navigate to finance dashboard - all charts should populate
3. **Test Branch Detection**: `NEON_BRANCH_NAME=test-branch pnpm db:seed`
4. **Run Tests**: `pnpm --filter @afenda/db test`
5. **Create PR**: Include SEEDING-ARCHITECTURE.md and screenshots
6. **Ready for Dev Team**: Updated docs, working auto-seed

---

## Pre-Implementation Checklist

- [x] `DATABASE_URL_DIRECT` environment variable configured
- [x] `createDbSession` exists in `packages/db/src/session.ts`
- [x] `createDirectClient` exists in `packages/db/src/client.ts`
- [x] Domain services accessible from `packages/modules/finance`
- [x] Dashboard queries in `apps/web/src/features/finance/dashboard/queries/`
- [x] Existing seed script at `packages/db/src/seed.ts`
- [x] `db:seed` script in `packages/db/package.json`

---

## Summary

This reference document provides:
- ✅ Exact file paths for all new and existing files
- ✅ File content templates for key components
- ✅ Import patterns for RLS, drizzle-seed, and domain services
- ✅ Environment variable requirements
- ✅ CLI command examples
- ✅ Post-implementation documentation requirements
- ✅ Development workflow
- ✅ Pre-implementation checklist

**Next Step**: Begin implementation following the [Database Seeding Strategy Plan](../../.cursor/plans/database_seeding_strategy_ef814868.plan.md)

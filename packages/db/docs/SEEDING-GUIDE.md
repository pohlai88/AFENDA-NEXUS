# Database Seeding Guide

Production-grade database seeding for NEXUSCANON-AFENDA with Neon Postgres, Drizzle ORM, and RLS support.

## Quick Start

```bash
# Seed with auto-detected Neon branch and depth
pnpm --filter @afenda/db db:seed

# Specify deterministic seed (reproducible data)
pnpm db:seed -- --seed=1337

# Comprehensive seeding for demos
pnpm db:seed -- --depth=comprehensive --months=12

# Force reseed (ignores idempotency check)
pnpm db:seed -- --reset

# Skip dashboard verification
pnpm db:seed -- --verify=false
```

## Features

### ✅ Production-Ready

- **Deterministic**: Same `--seed` value = same data every time
- **Idempotent**: Safe to run multiple times (hash-based registry prevents duplicates)
- **RLS-Safe**: All multi-tenant data properly isolated via `createDbSession`
- **Dashboard Contract**: Verifies all dashboard charts will have data
- **Neon-Optimized**: Auto-detects branches, uses direct connections, avoids pooled endpoints

### ✅ Developer-Friendly

- **Auto-Seed**: Optional auto-seeding on API startup (development only)
- **CLI Flags**: Full control over depth, months, scenarios
- **Branch-Aware**: Minimal data for previews, comprehensive for main
- **Fast**: Standard depth seeds in ~10 seconds

## Environment Variables

```bash
# Required
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xyz.neon.tech/dbname?sslmode=require

# Optional: Neon Branch Detection
NEON_BRANCH_NAME=preview-pr-123     # Explicit branch name (Vercel, GitHub Actions)
NEON_BRANCH_TYPE=preview            # main|dev|preview|test
GIT_BRANCH=$GITHUB_HEAD_REF         # Alternative: use Git branch name

# Optional: Auto-Seed (Development Only)
NODE_ENV=development
AFENDA_AUTO_SEED=1                  # Enable auto-seed on API startup
```

## CLI Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--seed` | number | `1337` | Deterministic seed for reproducible data |
| `--depth` | string | auto | Seeding depth: `minimal \| standard \| comprehensive` |
| `--months` | number | `6` | Number of months of transactional data |
| `--scenarios` | string[] | `['baseline']` | Transaction scenarios to run |
| `--reset` | boolean | `false` | Force reseed (ignores hash check) |
| `--verify` | boolean | `true` | Run dashboard contract after seed |

## Seeding Depth

### Minimal (Auto-selected for dev/preview branches)

- **Time**: ~5 seconds
- **Data**: 1 company, 20 customers, 10 suppliers, 1 month transactions
- **Use**: Feature development, preview deploys, CI

### Standard (Auto-selected for test branches)

- **Time**: ~10 seconds
- **Data**: 2 companies, 50 customers, 30 suppliers, 6 months transactions
- **Use**: Integration tests, QA environments

### Comprehensive (Auto-selected for main branch)

- **Time**: ~30 seconds
- **Data**: 2 companies, 80 customers, 50 suppliers, 12 months transactions
- **Use**: Demos, performance testing, production-like data

## Transaction Scenarios

### Baseline (Default)

Steady operations with realistic cash flow:

- 20-30 AR invoices per month
- 15-20 AP invoices per month
- Monthly payroll journals
- Monthly depreciation journals
- 80% on-time payments, 20% delayed

Use: General development, balanced dashboards

### Late Payments (Coming Soon)

DSO worsening over time:

- Progressively delayed payments (30→75 days)
- Shifting aging buckets (current → 60+)
- Increasing outstanding AR

Use: Testing collection workflows, aging reports

### FX Volatility (Coming Soon)

Realized foreign exchange gains/losses:

- Multi-currency invoices
- Fluctuating exchange rates
- FX revaluation journals

Use: Multi-currency scenarios, FX reporting

### Growth (Coming Soon)

Increasing revenue trajectory:

- Month-over-month revenue growth
- Expanding customer base
- Improving margins

Use: Growth dashboards, trend analysis

## Auto-Seeding (Development)

The API server can auto-seed on startup when **all** conditions are met:

1. ✅ `NODE_ENV=development`
2. ✅ `AFENDA_AUTO_SEED=1` (explicit opt-in)
3. ✅ Non-production database (localhost OR Neon non-main branch)
4. ✅ No existing `seed_run` record

### Setup

```bash
# .env.local
NODE_ENV=development
AFENDA_AUTO_SEED=1
DATABASE_URL_DIRECT=postgresql://localhost:5432/afenda
```

Start API:

```bash
pnpm --filter @afenda/api dev
```

The database will be seeded automatically on first startup, then skipped on subsequent runs (idempotency).

## Dashboard Contract

After seeding, the system verifies that all dashboard charts will have data:

### Checks

- ✅ **DSO Trend**: ≥30 AR invoices
- ✅ **Liquidity Waterfall**: ≥10 cash movements
- ✅ **GL Journals**: ≥5 posted journals
- ✅ **Financial Ratios**: ≥3 asset accounts, ≥2 liability accounts
- ✅ **Time Coverage**: Data in ≥6 fiscal periods
- ✅ **Aging Distribution**: Realistic bucket distribution (current, 30, 60, 90+)

If any check fails, the seed operation will fail with specific error messages.

## Idempotency

Seeding is idempotent via the `platform.seed_run` registry:

- **Composite Key**: `(seed_key, branch_name, tenant_id)`
- **Hash Check**: SHA256 of `{depth, seed, months, scenarios, version}`
- **Behavior**: Skip if same config already seeded

### Force Reseed

```bash
pnpm db:seed -- --reset
```

This updates the registry and re-runs the seeder.

## Neon Branch Integration

Seeding automatically adapts to Neon branches:

| Branch Type | Depth | Companies | Customers | Months | Scenarios |
|-------------|-------|-----------|-----------|--------|-----------|
| `main` | comprehensive | 2 | 80 | 12 | baseline |
| `test-*` | standard | 2 | 50 | 6 | baseline |
| `preview-*` | minimal | 1 | 20 | 1 | baseline |
| `dev` | minimal | 1 | 20 | 1 | baseline |

Override with `--depth`:

```bash
NEON_BRANCH_NAME=preview-pr-123 pnpm db:seed -- --depth=standard
```

## Troubleshooting

### "Cannot use pooled connection for seeding"

**Cause**: `DATABASE_URL_DIRECT` contains `-pooler` suffix.

**Fix**: Use direct connection string from Neon dashboard:

```bash
# ❌ Wrong (pooled)
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xyz-pooler.neon.tech/db

# ✅ Correct (direct)
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xyz.neon.tech/db
```

### "Config changed. Use --reset to force reseed"

**Cause**: Seed configuration changed since last run (e.g., `--months=12` instead of `6`).

**Fix**: Either use `--reset` to force reseed, or accept the existing data:

```bash
pnpm db:seed -- --reset
```

### "Dashboard contract failed: DSO Trend: Expected ≥30 invoices, got 12"

**Cause**: Insufficient transactional data for dashboard requirements.

**Fix**: Increase seeding depth or months:

```bash
pnpm db:seed -- --depth=standard --months=6 --reset
```

### Seeding is slow

**Optimization**:

- ✅ Use `DATABASE_URL_DIRECT` (not pooled)
- ✅ Run on main branch for production-like data only
- ✅ Use `minimal` depth for development

Typical times:

- Minimal: 5s
- Standard: 10s
- Comprehensive: 30s

## Examples

### Local Development

```bash
# First-time setup
pnpm db:seed

# Change scenarios
pnpm db:seed -- --scenarios=baseline --scenarios=late-payments --reset

# Quick reseed with minimal data
pnpm db:seed -- --depth=minimal --months=1 --reset
```

### CI/CD Pipeline

```bash
# GitHub Actions
NEON_BRANCH_NAME=$GITHUB_HEAD_REF \
NEON_BRANCH_TYPE=preview \
pnpm db:seed -- --depth=minimal --verify

# Vercel Preview
NEON_BRANCH_NAME=$VERCEL_GIT_COMMIT_REF \
pnpm db:seed -- --depth=minimal
```

### Demo Environment

```bash
# Full 12 months of realistic data
pnpm db:seed -- --depth=comprehensive --months=12 --seed=42 --reset
```

## Architecture

See [`SEEDING-ARCHITECTURE.md`](./SEEDING-ARCHITECTURE.md) for implementation details:

- Platform seeders (drizzle-seed)
- Master data seeders (drizzle-seed)
- Transaction scenarios (domain services)
- RLS safety (createDbSession)
- Dashboard contract (query-based assertions)
- Neon branch detection
- Idempotency registry

## Contributing

### Adding a New Scenario

1. Create `packages/db/src/scenarios/my-scenario.scenario.ts`
2. Export `runMyScenario(db, options)` function
3. Import and call in `seed.ts`
4. Update CLI scenarios array

Example:

```typescript
// my-scenario.scenario.ts
export async function runMyScenario(
  db: DbClient,
  options: ScenarioOptions
): Promise<void> {
  // Use createDbSession for RLS safety
  // Call domain services for transactions
  // Ensure dashboard contract coverage
}
```

### Adding a New Master Data Seeder

1. Create `packages/db/src/master/my-entity.seeder.ts`
2. Use `drizzle-seed` for deterministic generation
3. Wrap in `session.withTenantAndCompany()` for RLS
4. Call from `seedMasterData()` in master-data.seeder.ts

## See Also

- [SEEDING-IMPLEMENTATION-REFERENCE.md](../SEEDING-IMPLEMENTATION-REFERENCE.md) - Implementation guide
- [NEON-DRIZZLE-BEST-PRACTICES.md](./NEON-DRIZZLE-BEST-PRACTICES.md) - Neon + Drizzle patterns
- [NEON-INTEGRATION.md](./NEON-INTEGRATION.md) - Neon-specific configuration
- [Database Seeding Strategy Plan](../../.cursor/plans/database_seeding_strategy_ef814868.plan.md) - Original design document

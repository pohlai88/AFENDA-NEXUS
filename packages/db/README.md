# @afenda/db

Drizzle schema, migrations, RLS policies, tenant-scoped sessions, and prepared
queries for the Afenda ERP platform. Neon-optimized with `pg_uuidv7` DB-native
IDs, PgBouncer pooling, and RLS. See
[docs/NEON-INTEGRATION.md](./docs/NEON-INTEGRATION.md) for schema sync and Neon
capabilities. IDs, protocol-level prepared statements on pooled connections, and
`SET LOCAL` tenant context.

## Schema → Migration → Deploy Workflow

**Schema is the single source of truth.** All tables, columns, indexes, and
enums are defined in `src/schema/*.ts`. Drizzle Kit auto-generates SQL
migrations by diffing schema snapshots — no hand-written SQL.

### Developer Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. Edit schema          src/schema/*.ts                │
│  2. Generate migration   pnpm db:generate               │
│  3. Review SQL           drizzle/XXXX_<name>.sql         │
│  4. Apply to dev         pnpm db:push   (or db:migrate)  │
│  5. Commit               git add drizzle/ src/schema/    │
│  6. CI gate              pnpm db:ci     (auto in CI)     │
│  7. Deploy to prod       pnpm db:migrate                 │
└─────────────────────────────────────────────────────────┘
```

### Commands

| Command            | Scope   | Purpose                                      |
| ------------------ | ------- | -------------------------------------------- |
| `pnpm db:generate` | Local   | Diff schema → generate SQL migration file    |
| `pnpm db:migrate`  | Prod/CI | Apply pending migrations via versioned SQL   |
| `pnpm db:push`     | Dev     | Apply schema directly (no migration files)   |
| `pnpm db:check`    | CI      | Validate snapshot ↔ migration consistency    |
| `pnpm db:ci`       | CI      | Full gate: check + verify no pending changes |
| `pnpm db:studio`   | Local   | Open Drizzle Studio GUI                      |
| `pnpm db:seed`     | Local   | Seed enterprise reference data               |
| `pnpm db:reset`    | Local   | Migrate + seed (fresh start)                 |

### Environment Variables

| Variable              | Required For            | Example                                               |
| --------------------- | ----------------------- | ----------------------------------------------------- |
| `DATABASE_URL`        | Runtime (pooled)        | `postgresql://...@ep-xxx-pooler.aws.neon.tech/neondb` |
| `DATABASE_URL_DIRECT` | Migrations, drizzle-kit | `postgresql://...@ep-xxx.aws.neon.tech/neondb`        |

### Adding a Column (Example)

```ts
// 1. Edit src/schema/erp.ts — add column to table definition
export const glJournals = erpSchema.table('gl_journal', {
  // ... existing columns
  approvedBy: uuid('approved_by'), // ← new column
  // ...
});

// 2. Generate migration
// $ pnpm db:generate
// → drizzle/0001_add_approved_by.sql created

// 3. Review the generated SQL
// ALTER TABLE "erp"."gl_journal" ADD COLUMN "approved_by" uuid;

// 4. Apply
// $ pnpm db:push     # dev (direct apply)
// $ pnpm db:migrate  # prod (versioned migration)
```

### CI Gate Configuration

Three CI gates protect the database package:

| Gate | Script | Purpose |
| ---- | ------ | ------- |
| `db:ci` | `db-check-ci.mjs` | Snapshot consistency + no uncommitted schema changes |
| `gate:db-module` | `gate-db-module.mjs` | Every table has `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` |
| `gate:schema-conventions` | `gate-schema-conventions.mjs` | SC-01–SC-08: enableRLS, tenantCol, references, AnyPgColumn, moneyBigint, pkId, timestamps, relations |

```yaml
# GitHub Actions example
jobs:
  ci:
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm db:ci             # ← fails if schema changes lack migrations
      - run: pnpm module:gates       # ← runs all 31 gates including db-module + schema-conventions
```

If `db:ci` fails, run `pnpm db:generate` and commit the result.
If `gate:schema-conventions` fails, see [CONTRIBUTING-DB.md](./CONTRIBUTING-DB.md) for fix instructions.

**Troubleshooting:** If `db:generate` produces a full schema dump (70KB+ SQL)
instead of an incremental migration, the snapshot chain is broken. See
[docs/NEON-INTEGRATION.md § Troubleshooting](./docs/NEON-INTEGRATION.md#troubleshooting-schema-drift--full-dump).

### Neon Branch Strategy

| Branch      | Neon Branch       | Usage                                         |
| ----------- | ----------------- | --------------------------------------------- |
| `main`      | `production`      | Live database, migrations applied via CI      |
| `feature/*` | Neon child branch | Isolated dev DB via `neonctl branches create` |
| PR merge    | —                 | `pnpm db:migrate` runs against production     |

```bash
# Create a Neon branch for feature development
neonctl branches create --name feature/my-feature --project-id dark-band-87285012

# Get the connection string for the branch
neonctl connection-string feature/my-feature --project-id dark-band-87285012

# Push schema changes to the branch (no migration files needed for dev)
DATABASE_URL_DIRECT=<branch-url> pnpm db:push

# When done, delete the branch
neonctl branches delete feature/my-feature --project-id dark-band-87285012
```

## Architecture

### Schemas (125 tables)

| Schema     | Tables | Purpose                     | Key Domains                                                                                             |
| ---------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `platform` | 7      | Multi-tenant infrastructure | `tenant`, `company`, `user`, `user_preference`, `system_config`, `admin_user`, `admin_action_log`       |
| `erp`      | 117    | Core ERP domain             | GL, AP, AR, IC, Tax, Assets, Banking, Credit, Expenses, Projects, Leases, Provisions, Cost Accounting, Consolidation, IFRS, Supplier MDM, Documents, SoD, Approvals, Outbox |
| `audit`    | 1      | Immutable audit trail       | `audit_log`                                                                                             |

### Connection Types

| Connection | Env Var               | Pool      | Use Case                                         |
| ---------- | --------------------- | --------- | ------------------------------------------------ |
| **Pooled** | `DATABASE_URL`        | `max: 10` | Fastify API, Next.js SSR (high concurrency)      |
| **Direct** | `DATABASE_URL_DIRECT` | `max: 3`  | Graphile Worker (`LISTEN/NOTIFY`), `drizzle-kit` |

All connections are hardened for Neon production:

- `ssl: "require"` — prevents TLS downgrade
- `idle_timeout: 20s` — releases connections before Neon compute suspend
- `connect_timeout: 10s` — covers Neon cold-start + autoscale worst-case
- `max_lifetime: 30min` — rotates connections to respect PgBouncer
  server_lifetime
- `application_name: afenda_pooled|afenda_direct` — identifies connections in
  `pg_stat_activity`

### Tenant Isolation

Every tenant-scoped operation runs inside a transaction with `SET LOCAL`:

```ts
import { createPooledClient, createDbSession } from '@afenda/db';
import { glJournals } from '@afenda/db';

const db = createPooledClient({ connectionString: process.env.DATABASE_URL! });
const session = createDbSession({ db });

const journals = await session.withTenant({ tenantId, userId }, async (tx) =>
  tx.select().from(glJournals)
);
```

> **Important:** `SET LOCAL` only works inside a transaction. On Neon PgBouncer
> (transaction mode), calling `SET LOCAL` outside a transaction has no effect.
> Always use `withTenant()`.

### Drizzle Config (`drizzle.config.ts`)

```ts
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/*.ts', // ← source of truth
  out: './drizzle', // ← generated migrations
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! },
  schemaFilter: ['platform', 'erp', 'audit', 'public'],
  entities: { roles: { provider: 'neon' } },
  migrations: { schema: 'public' }, // ← __drizzle_migrations table location
  verbose: true,
  strict: true, // ← require confirmation for destructive ops
});
```

## Key Design Decisions

- **Schema-first migrations** — `drizzle-kit generate` diffs TypeScript schema
  against last snapshot. No hand-written SQL.
- **UUIDv7 via `pg_uuidv7`** — All PKs use `DEFAULT uuid_generate_v7()`. No
  app-side ID generation.
- **`moneyBigint`** — Money stored as native `bigint` (mode: "bigint") in minor
  units. No floating-point precision loss. Defaults use `sql\`0\`` for
  drizzle-kit serialization compatibility.
- **`SET LOCAL` on pooled** — Transaction-scoped, safe on PgBouncer transaction
  mode.
- **CI gate** — `pnpm db:ci` blocks PRs with uncommitted schema changes.

## Exports

```ts
// Client factories (Neon-hardened)
export { createPooledClient, createDirectClient } from '@afenda/db';
export type { ConnectionOptions, DbClient } from '@afenda/db';

// Session with tenant context
export { createDbSession } from '@afenda/db';
export type { DbSession, TenantContext } from '@afenda/db';

// Prepared queries (tenant-scoped, defense-in-depth)
export { createPreparedQueries } from '@afenda/db';

// Migration runner (direct connection, auto-cleanup)
export { migrate } from '@afenda/db';

// Schema tables + enums + helpers
export {
  tenants,
  companies,
  users,
  glJournals,
  glJournalLines,
  accounts /* ... */,
} from '@afenda/db';

// Subpath: direct client access
import { createPooledClient } from '@afenda/db/client';
```

## Layer Rules

- Never imports `@afenda/platform` — logger/config injected by apps
- Never imports `@afenda/modules/*` — modules import db, not the reverse
- No cross-module DB joins (per PROJECT.md §7)

## Related

- [`CONTRIBUTING-DB.md`](./CONTRIBUTING-DB.md) — **Schema conventions, drift
  prevention, new-table checklist**
- [`architecture.db.md`](./architecture.db.md) — Full Neon-optimized spec
- [`ARCHITECTURE.@afenda-db.md`](./ARCHITECTURE.@afenda-db.md) — Governance
  frontmatter
- [`docs/NEON-INTEGRATION.md`](./docs/NEON-INTEGRATION.md) — Schema sync & Neon
  capabilities
- [`docs/NEON-DRIZZLE-BEST-PRACTICES.md`](./docs/NEON-DRIZZLE-BEST-PRACTICES.md)
  — Industry-benchmarked patterns
- [`docs/SEEDING-GUIDE.md`](./docs/SEEDING-GUIDE.md) — Database seeding user
  guide
- [`docs/SEEDING-ARCHITECTURE.md`](./docs/SEEDING-ARCHITECTURE.md) — Seeding
  system architecture
- [`drizzle/_archive/`](./drizzle/_archive/) — Legacy hand-written migrations
  (pre-Drizzle Kit)

## Database Seeding

Production-grade seeding system with Neon branch integration, idempotency, RLS safety, and dashboard verification.

### Quick Start

```bash
# Seed with auto-detected Neon branch and depth
pnpm db:seed

# Deterministic seeding (reproducible data)
pnpm db:seed -- --seed=1337

# Comprehensive data for demos
pnpm db:seed -- --depth=comprehensive --months=12

# Force reseed (ignores hash check)
pnpm db:seed -- --reset

# Multiple scenarios
pnpm db:seed -- --scenarios=baseline --scenarios=late-payments
```

### Features

- **Deterministic**: Same `--seed` = same data every time
- **Idempotent**: Safe to run multiple times (hash-based registry)
- **RLS-Safe**: All tenant-scoped data properly isolated
- **Branch-Aware**: Auto-adjusts depth for Neon branches (minimal for dev/preview, comprehensive for main)
- **Dashboard-Verified**: Guarantees all 8 dashboard charts will populate
- **Fast**: Standard depth seeds in ~10 seconds

### Seeding Depth

| Depth | Companies | Customers | Suppliers | Months | Time | Use |
|-------|-----------|-----------|-----------|--------|------|-----|
| **minimal** | 1 | 20 | 10 | 1 | ~5s | Dev, preview branches, CI |
| **standard** | 2 | 50 | 30 | 6 | ~10s | Test branches, QA |
| **comprehensive** | 2 | 80 | 50 | 12 | ~30s | Main branch, demos |

### Auto-Seeding (Development Only)

The API server can auto-seed on startup when all guards pass:

```bash
# .env.local
NODE_ENV=development
AFENDA_AUTO_SEED=1
DATABASE_URL_DIRECT=postgresql://localhost:5432/afenda
```

**Guards**:
1. ✅ `NODE_ENV=development`
2. ✅ `AFENDA_AUTO_SEED=1` (explicit opt-in)
3. ✅ Non-production database (localhost OR Neon non-main branch)
4. ✅ No existing `seed_run` record

Start API: `pnpm --filter @afenda/api dev` — database seeds automatically on first run.

### Environment Variables

```bash
# Required
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xyz.neon.tech/dbname?sslmode=require

# Optional: Neon Branch Detection (set by Vercel, GitHub Actions)
NEON_BRANCH_NAME=preview-pr-123
NEON_BRANCH_TYPE=preview          # main|dev|preview|test
GIT_BRANCH=$GITHUB_HEAD_REF
```

### CLI Options

```bash
--seed=1337                      # Deterministic seed number
--depth=minimal                  # minimal|standard|comprehensive
--months=6                       # Transaction history months
--scenarios=baseline             # baseline|late-payments|fx-volatility|growth
--reset                          # Force reseed (ignores hash check)
--verify                         # Run dashboard contract (default: true)
```

### Dashboard Contract

Post-seeding verification ensures all charts have data:

- ✅ **DSO Trend**: ≥30 AR invoices, ≥20 receipts
- ✅ **Liquidity Waterfall**: ≥10 cash movements, 6+ months
- ✅ **Financial Ratios**: ≥3 asset accounts, ≥2 liability accounts
- ✅ **Time Coverage**: Data in ≥6 fiscal periods
- ✅ **Aging Distribution**: Realistic bucket spread (current, 30, 60, 90+)

If any check fails, seeding throws with specific error messages.

### Documentation

- **[SEEDING-GUIDE.md](./docs/SEEDING-GUIDE.md)** — Full usage guide with examples
- **[SEEDING-ARCHITECTURE.md](./docs/SEEDING-ARCHITECTURE.md)** — System architecture and design
- **[SEEDING-IMPLEMENTATION-REFERENCE.md](./SEEDING-IMPLEMENTATION-REFERENCE.md)** — Implementation checklist


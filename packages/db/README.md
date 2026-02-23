# @afenda/db

Drizzle schema, migrations, RLS policies, tenant-scoped sessions, and prepared queries for the Afenda ERP platform. Neon-optimized with `pg_uuidv7` DB-native IDs, protocol-level prepared statements on pooled connections, and `SET LOCAL` tenant context.

## Schema → Migration → Deploy Workflow

**Schema is the single source of truth.** All tables, columns, indexes, and enums are defined in `src/schema/*.ts`. Drizzle Kit auto-generates SQL migrations by diffing schema snapshots — no hand-written SQL.

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

| Command | Scope | Purpose |
|---------|-------|---------|
| `pnpm db:generate` | Local | Diff schema → generate SQL migration file |
| `pnpm db:migrate` | Prod/CI | Apply pending migrations via versioned SQL |
| `pnpm db:push` | Dev | Apply schema directly (no migration files) |
| `pnpm db:check` | CI | Validate snapshot ↔ migration consistency |
| `pnpm db:ci` | CI | Full gate: check + verify no pending changes |
| `pnpm db:studio` | Local | Open Drizzle Studio GUI |
| `pnpm db:seed` | Local | Seed enterprise reference data |
| `pnpm db:reset` | Local | Migrate + seed (fresh start) |

### Environment Variables

| Variable | Required For | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Runtime (pooled) | `postgresql://...@ep-xxx-pooler.aws.neon.tech/neondb` |
| `DATABASE_URL_DIRECT` | Migrations, drizzle-kit | `postgresql://...@ep-xxx.aws.neon.tech/neondb` |

### Adding a Column (Example)

```ts
// 1. Edit src/schema/erp.ts — add column to table definition
export const glJournals = erpSchema.table("gl_journal", {
  // ... existing columns
  approvedBy: uuid("approved_by"),  // ← new column
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

The `pnpm db:ci` script (`tools/scripts/db-check-ci.mjs`) runs two checks:

1. **`drizzle-kit check`** — validates migration snapshots are internally consistent
2. **`drizzle-kit generate` (dry-run)** — detects uncommitted schema changes

Add to your CI pipeline:

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
      - run: pnpm db:ci          # ← fails if schema changes lack migrations
      - run: pnpm arch:guard     # ← architecture governance
```

If `db:ci` fails, the developer must run `pnpm db:generate` and commit the result.

### Neon Branch Strategy

| Branch | Neon Branch | Usage |
|--------|-------------|-------|
| `main` | `production` | Live database, migrations applied via CI |
| `feature/*` | Neon child branch | Isolated dev DB via `neonctl branches create` |
| PR merge | — | `pnpm db:migrate` runs against production |

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

### Schemas (27 tables)

| Schema | Purpose | Tables |
|--------|---------|--------|
| `platform` | Multi-tenant infrastructure | `tenant`, `company`, `user` |
| `erp` | Core ERP domain | `currency`, `fiscal_year`, `fiscal_period`, `account`, `ledger`, `gl_journal`, `gl_journal_line`, `gl_balance`, `counterparty`, `fx_rate`, `ic_agreement`, `ic_transaction`, `ic_transaction_leg`, `ic_settlement`, `ic_settlement_line`, `recurring_template`, `budget_entry`, `revenue_contract`, `recognition_milestone`, `classification_rule_set`, `classification_rule`, `idempotency_store`, `outbox` |
| `audit` | Immutable audit trail | `audit_log` |

### Connection Types

| Connection | Env Var | Pool | Use Case |
|-----------|---------|------|----------|
| **Pooled** | `DATABASE_URL` | `max: 10` | Fastify API, Next.js SSR (high concurrency) |
| **Direct** | `DATABASE_URL_DIRECT` | `max: 3` | Graphile Worker (`LISTEN/NOTIFY`), `drizzle-kit` |

All connections are hardened for Neon production:
- `ssl: "require"` — prevents TLS downgrade
- `idle_timeout: 20s` — releases connections before Neon compute suspend
- `connect_timeout: 10s` — covers Neon cold-start + autoscale worst-case
- `max_lifetime: 30min` — rotates connections to respect PgBouncer server_lifetime
- `application_name: afenda_pooled|afenda_direct` — identifies connections in `pg_stat_activity`

### Tenant Isolation

Every tenant-scoped operation runs inside a transaction with `SET LOCAL`:

```ts
import { createPooledClient, createDbSession } from "@afenda/db";
import { glJournals } from "@afenda/db";

const db = createPooledClient({ connectionString: process.env.DATABASE_URL! });
const session = createDbSession({ db });

const journals = await session.withTenant(
  { tenantId, userId },
  async (tx) => tx.select().from(glJournals),
);
```

> **Important:** `SET LOCAL` only works inside a transaction. On Neon PgBouncer (transaction mode), calling `SET LOCAL` outside a transaction has no effect. Always use `withTenant()`.

### Drizzle Config (`drizzle.config.ts`)

```ts
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*.ts",       // ← source of truth
  out: "./drizzle",                  // ← generated migrations
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! },
  schemaFilter: ["platform", "erp", "audit", "public"],
  entities: { roles: { provider: "neon" } },
  migrations: { schema: "public" },  // ← __drizzle_migrations table location
  verbose: true,
  strict: true,                      // ← require confirmation for destructive ops
});
```

## Key Design Decisions

- **Schema-first migrations** — `drizzle-kit generate` diffs TypeScript schema against last snapshot. No hand-written SQL.
- **UUIDv7 via `pg_uuidv7`** — All PKs use `DEFAULT uuid_generate_v7()`. No app-side ID generation.
- **`moneyBigint`** — Money stored as native `bigint` (mode: "bigint") in minor units. No floating-point precision loss. Defaults use `sql\`0\`` for drizzle-kit serialization compatibility.
- **`SET LOCAL` on pooled** — Transaction-scoped, safe on PgBouncer transaction mode.
- **CI gate** — `pnpm db:ci` blocks PRs with uncommitted schema changes.

## Exports

```ts
// Client factories (Neon-hardened)
export { createPooledClient, createDirectClient } from "@afenda/db";
export type { ConnectionOptions, DbClient } from "@afenda/db";

// Session with tenant context
export { createDbSession } from "@afenda/db";
export type { DbSession, TenantContext } from "@afenda/db";

// Prepared queries (tenant-scoped, defense-in-depth)
export { createPreparedQueries } from "@afenda/db";

// Migration runner (direct connection, auto-cleanup)
export { migrate } from "@afenda/db";

// Schema tables + enums + helpers
export { tenants, companies, users, glJournals, glJournalLines, accounts, /* ... */ } from "@afenda/db";

// Subpath: direct client access
import { createPooledClient } from "@afenda/db/client";
```

## Layer Rules

- Never imports `@afenda/platform` — logger/config injected by apps
- Never imports `@afenda/modules/*` — modules import db, not the reverse
- No cross-module DB joins (per PROJECT.md §7)

## Related

- [`architecture.db.md`](./architecture.db.md) — Full Neon-optimized spec
- [`ARCHITECTURE.@afenda-db.md`](./ARCHITECTURE.@afenda-db.md) — Governance frontmatter
- [`drizzle/_archive/`](./drizzle/_archive/) — Legacy hand-written migrations (pre-Drizzle Kit)

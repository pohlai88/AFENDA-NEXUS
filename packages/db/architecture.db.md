# @afenda/db — Neon-Optimized Enterprise Spec (v4)

Optimizes the ratified v3-final spec with findings from the live Neon MCP server
(project `nexuscanon-axis` / `dark-band-87285012`, Postgres 17,
`aws-ap-southeast-1`), incorporating `pg_uuidv7` DB-native defaults, Neon
protocol-level prepared statements on pooled connections, Neon branching
automation, and connection architecture tuned to the actual PgBouncer config.

---

## Neon MCP Findings That Change the Design

| #   | v3-final Assumption                                     | Neon MCP Reality                                                                                                         | v4 Optimization                                                                                                      |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| N1  | UUIDv7 must be app-generated (Neon doesn't support it)  | **`pg_uuidv7` extension available on Neon PG17** — `uuid_generate_v7()` works as DB default                              | Use `DEFAULT uuid_generate_v7()` on all PKs — no app-side ID generation needed                                       |
| N2  | Pooled connections cannot use prepared statements       | **Neon PgBouncer supports protocol-level prepared statements** (`max_prepared_statements=1000`)                          | `.prepare()` is safe on pooled connections via protocol-level prep; only SQL-level `PREPARE`/`DEALLOCATE` is blocked |
| N3  | `SET LOCAL` not supported on pooled                     | **`SET LOCAL` IS supported** — it's transaction-scoped, and PgBouncer transaction mode returns connections after each tx | `SET LOCAL app.tenant_id` + `SET LOCAL ROLE` work correctly on pooled connections                                    |
| N4  | No concrete Neon project config                         | **Live project: `erpNEXT`** — PG17, ap-southeast-1, autoscaling 0.25→8 CU, `max_connections` 104→3357                    | Connection pool sizing and index strategy tuned to actual compute range                                              |
| N5  | Branching strategy was theoretical                      | **Neon branches support auto-expiry** (1h, 1d, 7d) and copy-on-write from any point in time                              | CI branches auto-expire; preview branches tied to PR lifecycle                                                       |
| N6  | Driver choice: `postgres.js` for both pooled and direct | **Neon AI rules recommend `@neondatabase/serverless`** for serverless/edge, `postgres.js` for long-running               | Keep `postgres.js` for Fastify API + Worker (long-running); option for `@neondatabase/serverless` in Next.js SSR     |

---

## What Stays From v3-final (Retained Unchanged)

- 3 schemas: `platform`, `erp`, `audit` via `pgSchema()`
- RLS on ALL tables including `platform.tenant`
- No `pgPolicy()` in Drizzle TS schema — policies in custom migration
- Roles: `app_runtime` (NOLOGIN) + `app_runtime_login` (LOGIN NOINHERIT) +
  `GRANT WITH SET TRUE`
- No passwords in migrations
- Composite tenant FKs (18 pairs)
- `gl_balance` composite PK (no surrogate)
- Split posting triggers: BEFORE (metadata) + DEFERRABLE AFTER (validation)
- Full immutability on POSTED/REVERSED/VOIDED
- Journal line CHECKs: `(debit=0) <> (credit=0)`
- `erp.current_tenant_id()` / `erp.current_user_id()` typed getters
- Expanded grants (tables + sequences + functions)
- Currency `decimal_places` CHECK 0..4
- `moneyBigint` custom type
- Drizzle `relations()` for relational queries
- 6 ordered migrations (dependency-correct)

---

## N1: `pg_uuidv7` — DB-Native UUIDv7

### What Changes

v3-final required app-generated UUIDv7 via `@afenda/core.generateId()`. With
`pg_uuidv7` on Neon PG17, we use DB defaults instead.

### Migration 0000 Adds

```sql
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
```

(Extension is in 0000_baseline.sql so it exists before any table creation.)

### Column Definition

```ts
// _common.ts
export const pkId = uuid('id')
  .primaryKey()
  .default(sql`uuid_generate_v7()`);
```

### Benefits

- **No app-side ID library needed** — removes `uuidv7` dependency from
  `@afenda/core`
- **DB-generated IDs are always valid** — no risk of malformed UUIDs from app
  bugs
- **Time-range queries on PKs** — `uuid_v7_to_timestamptz()` enables efficient
  time-based lookups without separate timestamp columns
- **B-tree locality** — sequential inserts, reduced page splits

### `gl_balance` Exception

Still uses composite PK
`(tenant_id, ledger_id, account_id, fiscal_year, fiscal_period)` — no surrogate
ID, no `uuid_generate_v7()`.

### `@afenda/core` Change

`generateId()` is **no longer needed** for DB PKs. Keep it only if other
packages need client-side IDs (e.g., optimistic UI). Otherwise, remove from
scope.

---

## N2: Prepared Statements on Pooled Connections

### What Changes

v3-final restricted `.prepare()` to direct connections only. Neon's PgBouncer
(1.22.0+) supports **protocol-level** prepared statements with
`max_prepared_statements=1000`.

### Clarification

| Statement Type                        | Pooled (PgBouncer)         | Direct    |
| ------------------------------------- | -------------------------- | --------- |
| Protocol-level `.prepare()` (Drizzle) | **Supported** (up to 1000) | Supported |
| SQL-level `PREPARE` / `DEALLOCATE`    | **Not supported**          | Supported |
| `SET` / `RESET` (session)             | Not supported              | Supported |
| `SET LOCAL` (transaction)             | **Supported**              | Supported |

### Updated Architecture

```ts
// Both pooled and direct sessions can use .prepare()
// postgres.js uses protocol-level prepared statements by default

// Pooled: prepare: true (default) — Neon PgBouncer handles it
export function createPooledClient(opts: ConnectionOptions) {
  const client = postgres(opts.connectionString, {
    max: opts.max ?? 10,
    ssl: 'require',
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    connection: { application_name: 'afenda_pooled' },
  });
  return drizzle({ client, schema, logger: false });
}
```

**Critical correction:** The v3-final spec had `prepare: false` on pooled. This
is **wrong for Neon** — Neon's PgBouncer supports protocol-level prepared
statements. Setting `prepare: false` disables query plan caching and hurts
performance.

### `prepared.ts` — Now Usable on Both Connection Types

```ts
// Hot-path prepared statements — usable on pooled AND direct
// All queries include tenantId in WHERE as defense-in-depth alongside RLS
export function createPreparedQueries(db: DbClient) {
  const findJournalById = db
    .select().from(glJournals)
    .where(and(
      eq(glJournals.tenantId, sql.placeholder("tenantId")),
      eq(glJournals.id, sql.placeholder("id")),
    ))
    .prepare("find_journal_by_id");

  const getTrialBalance = db
    .select({ ... })
    .from(glBalances)
    .innerJoin(accounts, eq(glBalances.accountId, accounts.id))
    .where(and(
      eq(glBalances.tenantId, sql.placeholder("tenantId")),
      eq(glBalances.ledgerId, sql.placeholder("ledgerId")),
      eq(glBalances.fiscalYear, sql.placeholder("year")),
    ))
    .prepare("get_trial_balance");

  return { findJournalById, findJournalsByPeriod, getTrialBalance, findAccountsByType, listActiveCurrencies, listCompanyLedgers } as const;
}
```

### ESLint Rule Removed

No longer need to guard against `.prepare()` on pooled — it's safe.

---

## N3: Connection Architecture (Revised)

### Why Still Two Connection Types

Even though `SET LOCAL` works on pooled, we keep two connections for different
reasons:

| Connection | Env Var               | Config                             | Use                                                      |
| ---------- | --------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Pooled** | `DATABASE_URL`        | `max: 10`, prepare: default (true) | Fastify API, Next.js SSR — high concurrency              |
| **Direct** | `DATABASE_URL_DIRECT` | `max: 3`                           | Graphile Worker (`LISTEN/NOTIFY`), `drizzle-kit migrate` |

**Key:** The split is now about `LISTEN/NOTIFY` (Worker needs it, pooled doesn't
support it) — not about prepared statements or `SET LOCAL`.

### Connection String Format (Neon)

```
# Pooled (add -pooler to endpoint)
DATABASE_URL=postgresql://app_runtime_login@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Direct
DATABASE_URL_DIRECT=postgresql://app_runtime_login@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Pool Sizing (Tuned to erpNEXT)

| Compute (CU) | `max_connections` | `default_pool_size` (90%) | App `max` Setting      |
| ------------ | ----------------- | ------------------------- | ---------------------- |
| 0.25 (min)   | 104               | 93                        | `max: 10` (safe)       |
| 8 (max)      | 3357              | 3021                      | `max: 10` (still fine) |

App-side `max: 10` is conservative and safe across the entire autoscaling range.
Neon's PgBouncer handles the rest.

---

## N4: Neon Branching (Automated)

### Branch Strategy (Concrete)

| Branch            | Source       | Lifecycle                                         | Compute             |
| ----------------- | ------------ | ------------------------------------------------- | ------------------- |
| `production`      | —            | Permanent, protected                              | 0.25→8 CU autoscale |
| `dev`             | `production` | Permanent, reset weekly via `neon branches reset` | 0.25→2 CU           |
| `preview/<pr-id>` | `production` | Auto-expire 1 day (Neon native)                   | 0.25 CU fixed       |
| `ci/<run-id>`     | `production` | Auto-expire 1 hour (Neon native)                  | 0.25 CU fixed       |

### CI Integration (GitHub Actions)

```yaml
# .github/workflows/db-test.yml
- name: Create Neon branch
  uses: neondatabase/create-branch-action@v5
  with:
    project_id: dark-band-87285012
    branch_name: ci/${{ github.run_id }}
    api_key: ${{ secrets.NEON_API_KEY }}

- name: Run migrations + tests
  env:
    DATABASE_URL_DIRECT: ${{ steps.branch.outputs.db_url }}
  run: |
    pnpm --filter @afenda/db db:migrate
    pnpm --filter @afenda/db db:seed
    pnpm --filter @afenda/db test

- name: Delete branch
  if: always()
  uses: neondatabase/delete-branch-action@v3
  with:
    project_id: dark-band-87285012
    branch: ci/${{ github.run_id }}
```

### Branch Authentication (Neon Auth Isolation)

Each Neon branch gets its own **isolated Auth API endpoint**. Because auth data
(`neon_auth` schema — users, sessions, OAuth config, JWKS keys) lives in the
database, it is cloned automatically when branching.

```
Production Branch                 Preview Branch (preview/pr-42)
├── neon_auth.user            →   ├── neon_auth.user (snapshot)
├── neon_auth.session         →   ├── neon_auth.session (copied, will expire)
├── neon_auth.project_config  →   ├── neon_auth.project_config (independent)
├── OAuth providers           →   ├── OAuth providers (same credentials)
└── ep-abc123.neonauth...         └── ep-xyz789.neonauth...
    (production endpoint)             (preview endpoint)
```

**Key rules:**

- Sessions do NOT transfer between branches (cookies are domain-scoped).
- Changes in one branch never affect another.
- Each branch Auth URL follows the pattern:
  `https://<endpoint-id>.neonauth.<region>.aws.neon.tech/neondb/auth`
- Preview URLs must be registered as trusted origins for OAuth redirects.

### Preview Deployment Workflow

Automated via `.github/workflows/preview.yml`:

1. PR opened → `neondatabase/create-branch-action@v5` creates `preview/pr-<id>`
2. Branch Auth URL derived from endpoint hostname
3. Trusted origin registered for the preview deployment URL
4. Tests run against isolated branch (DB + Auth)
5. PR closed → `neondatabase/delete-branch-action@v3` cleans up

### Local Development

Use Neon branch (not local Docker) for dev:

```bash
# One-liner: create branch + output env vars (DB + Auth URL)
node tools/scripts/neon-branch-env.mjs

# Or manually:
neonctl branches create --project-id dark-band-87285012 --name dev/$(whoami)
neonctl connection-string --project-id dark-band-87285012 --branch dev/$(whoami)
```

The helper script derives the branch's Neon Auth URL automatically. Add
the output to `.env.local`.

**Alternative:** Docker Compose with local Postgres for offline dev (still
supported, but without Neon Auth — use trusted-header fallback).

---

## N5: `drizzle.config.ts` (Neon-Optimized)

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/*.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!, // Direct — required for drizzle-kit
  },
  schemaFilter: ['platform', 'erp', 'audit', 'public'], // Multi-schema support
  entities: {
    roles: { provider: 'neon' }, // Exclude Neon system roles from diff
  },
  extensionsFilters: ['postgis'], // Exclude extension-managed objects from diff
  migrations: {
    schema: 'public', // drizzle migrations journal in public schema
  },
  verbose: true,
  strict: true,
});
```

---

## N6: Migration 0001 — Extension Setup

The first migration now includes `pg_uuidv7` extension creation:

```sql
-- 0001_init: first statement
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Then: CREATE SCHEMA platform; CREATE SCHEMA erp; CREATE SCHEMA audit;
-- Then: all enums, tables, indexes, composite FKs, CHECK constraints
-- All PKs use: id UUID PRIMARY KEY DEFAULT uuid_generate_v7()
```

### Full Migration Order (6 Migrations — Updated)

| #   | Migration                 | Type                   | Changes from v3-final                                                                                                              |
| --- | ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `0001_init`               | `drizzle-kit generate` | **+ `CREATE EXTENSION pg_uuidv7`**, PKs use `DEFAULT uuid_generate_v7()`                                                           |
| 2   | `0002_context_helpers`    | `--custom`             | Unchanged                                                                                                                          |
| 3   | `0003_roles_grants`       | `--custom`             | Unchanged                                                                                                                          |
| 4   | `0004_rls_policies_force` | `--custom`             | Unchanged                                                                                                                          |
| 5   | `0005_posting_guards`     | `--custom`             | Unchanged                                                                                                                          |
| 6   | `0006_p3_finance_tables`  | `--custom`             | **New** — `recurring_frequency` enum, `erp.idempotency_store`, `erp.recurring_template`, `erp.budget_entry` tables + RLS + indexes |

---

## Updated File Structure (Delta from v3-final)

```diff
 packages/db/
 ├── src/
 │   ├── index.ts
-│   ├── client.ts                   # prepare: false on pooled
+│   ├── client.ts                   # prepare: default (true), ssl: require, idle/connect timeouts, max_lifetime
-│   ├── session.ts                  # SET LOCAL outside tx (broken on PgBouncer)
+│   ├── session.ts                  # withTenant(ctx, fn) — transaction-wrapped SET LOCAL + set_config()
 │   ├── migrate.ts
-│   ├── seed.ts                     # minimal (hardcoded UUIDs)
+│   ├── seed.ts                     # full enterprise seed via returning() chains (zero hardcoded UUIDs)
-│   ├── prepared.ts                 # direct-only
+│   ├── prepared.ts                 # tenant-scoped (defense-in-depth), usable on pooled AND direct, 6 queries
+│   ├── health.ts                   # createHealthCheck(db) for /health endpoint
+│   ├── outbox-drainer.ts           # createOutboxDrainer(db) — SELECT FOR UPDATE SKIP LOCKED
 │   ├── schema/
-│   │   ├── _common.ts              # pkId = uuid("id").primaryKey()
+│   │   ├── _common.ts              # pkId() function — uuid("id").primaryKey().default(sql`uuid_generate_v7()`)
 │   │   ├── _enums.ts               # + recurringFrequencyEnum
+│   │   ├── idempotency-store.ts    # erp.idempotency_store (P2)
+│   │   ├── outbox-table.ts         # erp.outbox table definition
+│   │   ├── outbox.ts               # OutboxRow, OutboxWriter, OutboxDrainer types
 │   │   └── ... (all other schema files unchanged)
 │   └── types.ts                    # + FxRate, RecurringTemplate, BudgetEntry, IdempotencyStoreEntry types
 ├── drizzle/
 │   ├── 0001_init.sql               # + CREATE EXTENSION pg_uuidv7
 │   ├── 0002-0005                   # context helpers, roles, RLS, posting guards
 │   └── 0006_p3_finance_tables.sql  # recurring_frequency enum + 3 P3 tables + RLS
+├── .github/
+│   └── workflows/
+│       └── db-test.yml             # Neon branch CI integration
-├── drizzle.config.ts               # basic config
+├── drizzle.config.ts               # entities.roles.provider: "neon", schemaFilter, extensionsFilters
-├── package.json                    # + uuidv7 dep
+├── package.json                    # NO uuidv7 dep needed (DB-native)
 └── ...
```

---

## Updated Validation Checklist (Delta from v3-final)

All 17 v3-final checks retained, plus:

18. `uuid_generate_v7()` produces valid UUIDv7 on Neon PG17
19. `uuid_v7_to_timestamptz()` extracts correct timestamps from PKs
20. `.prepare()` works on pooled connections (protocol-level)
21. `LISTEN/NOTIFY` works on direct connections (Worker)
22. Neon branch creation/deletion via API succeeds
23. CI branch auto-expires after 1 hour
24. `prepare: true` (default) on pooled — no `prepare: false` override

---

## Summary: What v4 Changes vs v3-final

| Area                           | v3-final                                        | v4 (Neon-optimized)                                                                                                         |
| ------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **UUIDv7**                     | App-generated, `@afenda/core.generateId()`      | **DB-native `uuid_generate_v7()`** via `pg_uuidv7` extension                                                                |
| **Prepared stmts**             | Direct-only, pooled banned                      | **Both** — Neon PgBouncer supports protocol-level prep. All queries tenant-scoped (defense-in-depth).                       |
| **`prepare: false`**           | Required on pooled                              | **Removed** — wrong for Neon, hurts performance                                                                             |
| **Session**                    | `SET LOCAL` outside tx (no effect on PgBouncer) | **`withTenant(ctx, fn)`** — transaction-wrapped, `set_config()` parameterized, typed `TenantTx` callback                    |
| **Client**                     | No SSL, no timeouts                             | **Hardened** — `ssl: require`, `idle_timeout: 20`, `connect_timeout: 10`, `max_lifetime: 30min`, `application_name`         |
| **Seed**                       | Hardcoded UUIDs, minimal data                   | **Full enterprise seed** — `returning()` chains, 2 companies, 3 currencies, 9 COA, 12 periods, IC agreement, sample journal |
| **Pooled/direct split reason** | Prepared stmts + SET LOCAL                      | **LISTEN/NOTIFY only** (Worker needs it)                                                                                    |
| **Branching**                  | Theoretical                                     | **Concrete** — CI auto-expire, preview branches, Neon API actions                                                           |
| **`@afenda/core` change**      | Add `generateId()`                              | **Not needed** — DB handles IDs                                                                                             |
| **Extension**                  | None                                            | **`pg_uuidv7`** in 0001_init                                                                                                |
| **CI**                         | Schema drift + RLS coverage                     | **+ Neon branch lifecycle** in GitHub Actions                                                                               |
| **drizzle.config**             | Basic                                           | **`schemaFilter`** for multi-schema, **`extensionsFilters`**, `entities.roles.provider: "neon"`                             |

Everything else from v3-final is **retained unchanged** — schemas, RLS, roles,
grants, triggers, composite FKs, composite PK on gl_balance, money types,
indexing rules, posting invariants, immutability, audit trail.

# Contributing to @afenda/db — Schema & Migration Guide

Rules and conventions that prevent drift in the database package.
Every developer **must** read this before touching schema files.

---

## Golden Rules

| # | Rule | Enforced By |
|---|------|-------------|
| 1 | **Schema is the single source of truth.** Never hand-write migration SQL for tables/columns. | `db-check-ci` (drizzle-kit generate dry-run) |
| 2 | **Every table gets `.enableRLS()`** — no exceptions. | `gate:schema-conventions SC-01` + `gate:db-module` |
| 3 | **Every tenant table spreads `tenantCol()`** — 5 platform tables are exempt. | `gate:schema-conventions SC-02` |
| 4 | **Every FK column gets `.references()`** — typed, cascading, explicit. | `gate:schema-conventions SC-03` (warns) |
| 5 | **Self-referencing FKs use `AnyPgColumn`** — required by TypeScript. | `gate:schema-conventions SC-04` + `tsc --noEmit` |
| 6 | **Money is `moneyBigint()`** — never raw `bigint` for financial amounts. | `gate:schema-conventions SC-05` (warns) |
| 7 | **Every table has a `relations()` definition** in `relations.ts`. | `gate:schema-conventions SC-08` (warns) |
| 8 | **RLS policies exist for every table** — in `drizzle/custom/` migration. | `gate:db-module` |
| 9 | **Commit migrations with schema changes** — CI blocks bare schema edits. | `db-check-ci` |

---

## Adding a New Table — Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☐  1. Define table in src/schema/erp.ts (or appropriate file)      │
│        - Spread pkId(), tenantCol(), timestamps()                   │
│        - Add .enableRLS() at the end                                │
│        - Add FK .references() on every uuid FK column               │
│        - Self-refs: use (): AnyPgColumn => for the return type      │
│        - Money columns: use moneyBigint('column_name')              │
│        - Add CHECK constraints for domain invariants                │
│        - Add composite indexes: (tenantId, ...) for common queries  │
│                                                                     │
│  ☐  2. Add relations() in src/schema/relations.ts                   │
│        - Import the new table                                       │
│        - Define all one/many relationships                          │
│        - Use relationName for self-refs or multi-ref disambig       │
│                                                                     │
│  ☐  3. Export from src/schema/index.ts                              │
│                                                                     │
│  ☐  4. Generate migration: pnpm db:generate                        │
│                                                                     │
│  ☐  5. Add RLS policy to drizzle/custom/0001_rls_policies_and_      │
│        roles.sql (or a new custom migration):                       │
│        CREATE POLICY tenant_isolation ON schema.table_name          │
│          FOR ALL                                                    │
│          USING (tenant_id = current_setting('app.tenant_id',        │
│                 true)::uuid)                                        │
│          WITH CHECK (tenant_id = current_setting('app.tenant_id',   │
│                      true)::uuid);                                  │
│        ALTER TABLE schema.table_name FORCE ROW LEVEL SECURITY;      │
│                                                                     │
│  ☐  6. Run gates locally: pnpm gate:schema-conventions              │
│                            pnpm gate:db-module                      │
│                                                                     │
│  ☐  7. Type-check: pnpm --filter @afenda/db typecheck               │
│                                                                     │
│  ☐  8. Commit: git add packages/db/                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Schema Conventions (Enforced by `gate:schema-conventions`)

### SC-01: `.enableRLS()` on every table

```ts
// ✅ CORRECT
export const invoices = erpSchema.table('invoice', {
  ...pkId(),
  ...tenantCol(),
  // ...
}).enableRLS();

// ❌ WRONG — missing .enableRLS()
export const invoices = erpSchema.table('invoice', {
  ...pkId(),
  ...tenantCol(),
});
```

### SC-02: `tenantCol()` on every tenant-scoped table

```ts
// ✅ CORRECT
export const invoices = erpSchema.table('invoice', {
  ...pkId(),
  ...tenantCol(),    // ← required
  amount: moneyBigint('amount'),
  ...timestamps(),
}).enableRLS();

// 5 tables are exempt: tenant, user_preference, system_config, admin_user, admin_action_log
```

### SC-03: FK columns need `.references()`

```ts
// ✅ CORRECT — explicit FK
supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),

// ❌ WRONG — bare uuid FK
supplierId: uuid('supplier_id').notNull(),  // gate warns: "looks like FK but has no .references()"
```

Exception: Polymorphic FKs (like `entityId` that could point to multiple tables)
are intentionally untyped — suppress with a comment.

### SC-04: Self-referencing FKs need `AnyPgColumn`

```ts
// ✅ CORRECT
import { type AnyPgColumn } from 'drizzle-orm/pg-core';
parentId: uuid('parent_id').references((): AnyPgColumn => accounts.id, { onDelete: 'set null' }),

// ❌ WRONG — TypeScript error TS7022 (circular type inference)
parentId: uuid('parent_id').references(() => accounts.id, { onDelete: 'set null' }),
```

### SC-05: Money columns use `moneyBigint()`

```ts
// ✅ CORRECT — uses helper, bigint in minor units
totalAmount: moneyBigint('total_amount').notNull().default(sql`0`),

// ❌ WRONG — raw bigint
totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(sql`0`),
```

### SC-06 / SC-07: `pkId()` and `timestamps()`

Every table should spread both helpers (unless it has a composite PK):

```ts
export const invoices = erpSchema.table('invoice', {
  ...pkId(),         // ← UUIDv7 PK
  ...tenantCol(),    // ← tenant_id
  // ... domain columns
  ...timestamps(),   // ← created_at, updated_at
}).enableRLS();
```

### SC-08: Relations file coverage

Every exported table must have a corresponding `export const <name>Relations`
in `src/schema/relations.ts`:

```ts
// relations.ts
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [invoices.supplierId], references: [suppliers.id] }),
  lines: many(invoiceLines),
}));
```

---

## Index Conventions

### Always lead with `tenantId`

Every composite index must start with `tenantId` — RLS scopes every query by
tenant, and the planner needs tenant_id in the leading position:

```ts
(t) => [
  // ✅ CORRECT — tenant first
  index('idx_invoice_supplier').on(t.tenantId, t.supplierId),
  index('idx_invoice_date').on(t.tenantId, t.invoiceDate),

  // ❌ WRONG — tenant not leading
  index('idx_invoice_supplier').on(t.supplierId),
]
```

### Index naming

- `idx_<table>_<purpose>` for regular indexes
- `uq_<table>_<purpose>` for unique indexes
- Snake_case, matching the PostgreSQL table name (not the TS export name)

### When to add indexes

| Column Type | Index Needed? | Pattern |
|-------------|--------------|---------|
| FK column (used in JOINs) | Yes | `(tenantId, fkColumn)` |
| Status/enum (filtered in WHERE) | Yes | `(tenantId, status)` |
| Date column (range queries) | Yes | `(tenantId, dateCol)` |
| Unique business key | Via `uniqueIndex` | `(tenantId, code)` |

---

## Migration Types

### 1. Schema migrations (auto-generated by Drizzle Kit)

Located in `drizzle/XXXX_<name>.sql`. **Never hand-edit.**

```bash
pnpm db:generate         # diff schema → SQL
pnpm db:check            # verify snapshot consistency
```

### 2. Custom migrations (hand-written)

Located in `drizzle/custom/`. Used for things Drizzle Kit cannot generate:

- RLS policies (`CREATE POLICY`)
- Roles and grants (`CREATE ROLE`, `GRANT`)
- Helper functions (`CREATE FUNCTION`)
- `FORCE ROW LEVEL SECURITY`
- Data migrations

```bash
# No drizzle-kit command — apply manually
psql -f drizzle/custom/0001_rls_policies_and_roles.sql
# Or via the API deploy pipeline
```

### 3. Archived migrations

Located in `drizzle/_archive/`. Historical migrations that were part of the
pre-baseline era. **Never run. Never modify. Reference only.**

---

## CI Gates

| Gate | Script | Blocks CI? | What It Checks |
|------|--------|-----------|----------------|
| `db-module` | `gate-db-module.mjs` | **Yes** | Every `CREATE TABLE` in migrations has matching `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` |
| `schema-conventions` | `gate-schema-conventions.mjs` | **Yes** (violations) | SC-01 through SC-08: enableRLS, tenantCol, references, AnyPgColumn, moneyBigint, pkId, timestamps, relations |
| `db-check-ci` | `db-check-ci.mjs` | **Yes** | Schema ↔ migration snapshot consistency; no uncommitted schema changes |
| `schema-entity-alignment` | `gate-schema-entity-alignment.mjs` | Warn | Column naming alignment between Drizzle schema and domain entity interfaces |
| `money-safety` | `gate-money-safety.mjs` | **Yes** | Bans raw `BigInt(Math.round(x * 100))` — must use `toMinorUnits()` |
| `currency-safety` | `gate-currency-safety.mjs` | **Yes** | Bans hardcoded `'USD'` in money calls |

### Running gates locally

```bash
# Run all 30+ gates (parallel)
pnpm module:gates

# Run DB-specific gates only
node tools/scripts/gate-db-module.mjs
node tools/scripts/gate-schema-conventions.mjs
node tools/scripts/db-check-ci.mjs
```

---

## Common Mistakes & Fixes

### 1. "drizzle-kit generate produces a full schema dump (70KB+)"

The snapshot chain is broken. Fix:

```bash
# Nuclear option: regenerate baseline
cd packages/db
rm -rf drizzle/meta drizzle/*.sql
echo '{"version":"7","dialect":"postgresql","entries":[]}' > drizzle/meta/_journal.json
pnpm db:generate -- --name=0000_0000_enterprise_baseline
pnpm db:check  # must pass
```

### 2. "TypeScript error TS7022 on a self-referencing table"

Add `AnyPgColumn` import and annotate the return type:

```ts
import { type AnyPgColumn } from 'drizzle-orm/pg-core';

parentId: uuid('parent_id').references((): AnyPgColumn => myTable.id, { ... }),
```

### 3. "gate:db-module fails with 'Missing CREATE POLICY'"

You added a new table but forgot to add the RLS policy in
`drizzle/custom/0001_rls_policies_and_roles.sql` (or a new custom migration).
Add:

```sql
ALTER TABLE schema.new_table FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON schema.new_table
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### 4. "gate:schema-conventions warns about missing .references()"

Either add the FK reference:

```ts
supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
```

Or if it's a polymorphic FK (intentionally untyped), add the column name to
`FK_EXEMPT_COLUMNS` in `gate-schema-conventions.mjs`.

### 5. "New table works in dev but fails with RLS in CI/prod"

You forgot to use `withTenant()` for the query. Every tenant-scoped query must
run inside a tenant session:

```ts
const result = await session.withTenant({ tenantId, userId }, (tx) =>
  tx.select().from(newTable)
);
```

---

## Schema File Organization

```
packages/db/src/schema/
├── _common.ts          # pkId(), tenantCol(), timestamps(), moneyBigint()
├── _enums.ts           # All pgEnum definitions
├── _schemas.ts         # pgSchema('platform'), pgSchema('erp'), pgSchema('audit')
├── platform.ts         # 7 platform tables (tenant, company, user, admin, config)
├── erp.ts              # 109 ERP tables (GL, AP, AR, IC, Tax, Assets, Banking, ...)
├── erp-approval.ts     # 3 approval workflow tables
├── erp-document.ts     # 3 document/OCR tables
├── erp-sod.ts          # 1 SoD action log table
├── audit.ts            # 1 audit_log table
├── outbox-table.ts     # 1 outbox table
├── idempotency-store.ts # 1 idempotency_store table
├── relations.ts        # All Drizzle relations (125 exports)
└── index.ts            # Barrel export
```

### When to create a new schema file

- 1-3 closely related tables that form a self-contained sub-domain
- Must still use `erpSchema` (or `platformSchema`/`auditSchema`)
- Add `index` import from `drizzle-orm/pg-core` if adding indexes
- Export from `index.ts`
- Import in `relations.ts` and add relation definitions

---

## Helpers Reference

| Helper | Import | Purpose |
|--------|--------|---------|
| `pkId()` | `_common.ts` | UUIDv7 PK with `uuid_generate_v7()` default |
| `tenantCol()` | `_common.ts` | `tenant_id uuid NOT NULL` |
| `companyCol()` | `_common.ts` | `company_id uuid NOT NULL` |
| `timestamps()` | `_common.ts` | `created_at`, `updated_at` with timezone |
| `moneyBigint(name)` | `_common.ts` | `bigint` in minor units, mode: "bigint" |
| `uuidV7ToTimestamp(col)` | `_common.ts` | Extract timestamp from UUIDv7 for time-range queries |
| `erpSchema` | `_schemas.ts` | `pgSchema('erp')` |
| `platformSchema` | `_schemas.ts` | `pgSchema('platform')` |
| `auditSchema` | `_schemas.ts` | `pgSchema('audit')` |

---

## Quick Reference: Complete New Table Template

```ts
// In src/schema/erp.ts (or a new file)
import { type AnyPgColumn } from 'drizzle-orm/pg-core';  // only if self-referencing

export const myNewThings = erpSchema.table(
  'my_new_thing',
  {
    ...pkId(),
    ...tenantCol(),
    ...companyCol(),  // if company-scoped
    name: varchar('name', { length: 200 }).notNull(),
    status: myStatusEnum('status').notNull().default('DRAFT'),
    amount: moneyBigint('amount').notNull().default(sql`0`),
    parentId: uuid('parent_id').references((): AnyPgColumn => myNewThings.id, { onDelete: 'set null' }),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_my_new_thing_name_tenant').on(t.tenantId, t.companyId, t.name),
    index('idx_my_new_thing_status').on(t.tenantId, t.status),
    index('idx_my_new_thing_account').on(t.tenantId, t.accountId),
    index('idx_my_new_thing_parent').on(t.tenantId, t.parentId),
    check('chk_my_new_thing_amount_nonneg', sql`${t.amount} >= 0`),
  ]
).enableRLS();

// In src/schema/relations.ts
export const myNewThingsRelations = relations(myNewThings, ({ one, many }) => ({
  parent: one(myNewThings, {
    fields: [myNewThings.parentId],
    references: [myNewThings.id],
    relationName: 'parentChild',
  }),
  children: many(myNewThings, { relationName: 'parentChild' }),
  account: one(accounts, { fields: [myNewThings.accountId], references: [accounts.id] }),
}));

// Then: pnpm db:generate + add RLS policy + pnpm gate:schema-conventions
```

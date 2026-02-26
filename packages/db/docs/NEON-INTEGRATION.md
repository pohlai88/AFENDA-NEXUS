# Neon Integration & Schema Sync

Database optimization, Neon capabilities, and Drizzle ↔ SQL ↔ Neon Auth
synchronization.

**See also:** [NEON-DRIZZLE-BEST-PRACTICES.md](./NEON-DRIZZLE-BEST-PRACTICES.md)
— industry-benchmarked patterns for multi-tenant, multi-company, inter-company,
multi-national ERP.

---

## Identical Integration Synchronization

Bidirectional alignment between Drizzle schema, SQL migrations, Neon Auth, and
runtime.

### Schema Boundary Map

| Boundary      | Managed By | Drizzle                  | SQL                 | Purpose                             |
| ------------- | ---------- | ------------------------ | ------------------- | ----------------------------------- |
| **platform**  | Drizzle    | `src/schema/platform.ts` | 0000, 0001          | tenant, company, user               |
| **erp**       | Drizzle    | `src/schema/erp*.ts`     | 0000–0015           | ERP tables, SoD, approval, document  |
| **audit**     | Drizzle    | `src/schema/audit.ts`    | 0000, 0001          | audit_log                           |
| **public**    | Drizzle    | —                        | migrations          | \_\_drizzle_migrations (journal)    |
| **neon_auth** | Neon Auth  | ❌ excluded              | provision_neon_auth | user, session, organization, member |

**Rule:** `neon_auth` is never in Drizzle schema. It is provisioned by Neon MCP
`provision_neon_auth` and managed by Neon Auth service.

### drizzle.config.ts Alignment

```ts
schemaFilter: ['platform', 'erp', 'audit', 'public']; // neon_auth excluded
entities: {
  roles: {
    provider: 'neon';
  }
}
extensionsFilters: ['postgis'];
```

| Config                            | Sync Target                                        |
| --------------------------------- | -------------------------------------------------- |
| `schemaFilter`                    | Only Drizzle-managed schemas; `neon_auth` excluded |
| `entities.roles.provider: 'neon'` | Exclude Neon system roles from diff                |
| `extensionsFilters`               | Exclude extension-managed objects                  |

### Environment Variable Sync

| Variable                | Used By                     | Sync Rule                                                                                                         |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | API, web (pooled)           | Must use `-pooler` suffix for PgBouncer; add `?sslmode=verify-full&channel_binding=require&sslnegotiation=direct` |
| `DATABASE_URL_DIRECT`   | Worker, drizzle-kit         | No `-pooler`; for migrations, LISTEN/NOTIFY; same SSL params                                                      |
| `DATABASE_URL_READONLY` | API (optional)              | Read replica for reporting; omit to use primary                                                                   |
| `DATABASE_SSL_MODE`     | API, worker                 | Optional override: `require` \| `verify-full`                                                                     |
| `NEON_AUTH_BASE_URL`    | apps/web, apps/api          | Branch-specific; `https://<ep-id>.neonauth.<region>.aws.neon.tech/<db>/auth`                                      |
| `NEON_PROJECT_ID`       | neon-branch-env, preview CI | `dark-band-87285012`                                                                                              |

### Session → RLS → neon_auth Flow

```
Auth (Neon Auth)                    App (Drizzle)
─────────────────                  ─────────────────
session.activeOrganizationId   →    ctx.tenantId (getRequestContext)
neon_auth.organization.id     =    app.tenant_id (SET LOCAL)
neon_auth.member.role         ←    DrizzleRoleResolver (IRoleResolver)
```

| Step | Location                                                   | Sync                                                 |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 1    | `auth.getSession()` → `activeOrganizationId`               | neon_auth.session                                    |
| 2    | `getRequestContext()` → `tenantId`                         | apps/web auth.ts                                     |
| 3    | `withTenant({ tenantId })` → `set_config('app.tenant_id')` | packages/db session.ts                               |
| 4    | RLS `erp.current_tenant_id()`                              | Reads `app.tenant_id`                                |
| 5    | `DrizzleRoleResolver`                                      | Queries `neon_auth.member` by organizationId, userId |

### Migration ↔ RLS Mapping

| Migration | RLS Tables                                | Policy                                   |
| --------- | ----------------------------------------- | ---------------------------------------- |
| 0001      | platform._, erp._ (baseline), audit.\*    | `erp.current_tenant_id()`                |
| 0004      | IFRS tables                               | `current_setting('app.tenant_id')::uuid` |
| 0006      | gap remediation tables                    | `current_setting('app.tenant_id')::uuid` |
| 0010      | erp.sod_action_log                        | `erp.current_tenant_id()`                |
| 0011      | erp.approval_policy, erp.approval_request | `erp.current_tenant_id()`                |
| 0012      | 0004/0006 tables (standardized)           | `erp.current_tenant_id()`                |
| 0013      | company RLS, outbox index                | `erp.current_company_id()`               |
| 0014      | erp.document_attachment, document_link   | `erp.current_tenant_id()`                |

**Convention:** Prefer `erp.current_tenant_id()` (wraps `app.tenant_id` with
null handling).

---

## Schema Sync: Drizzle ↔ SQL

| Layer              | Location                       | Purpose                                     |
| ------------------ | ------------------------------ | ------------------------------------------- |
| **Drizzle schema** | `src/schema/*.ts`              | Type-safe ORM, relations, migrations source |
| **SQL migrations** | `drizzle/*.sql`                | Applied order; RLS/triggers are manual      |
| **Snapshot**       | `drizzle/meta/*_snapshot.json` | Drizzle-kit diff baseline                   |

### Sync Rules

1. **Tables & columns** — Drizzle schema is source of truth;
   `drizzle-kit generate` produces SQL.
2. **RLS policies** — Manual in migrations (0001, 0004, 0006, 0010, 0011, 0013, 0014). Use
   `erp.current_tenant_id()` or `erp.current_company_id()`.
3. **Extensions** — `pg_uuidv7` in 0000_baseline.sql (before any table). If you
   have an existing DB that ran 0000 before this change, run
   `CREATE EXTENSION IF NOT EXISTS pg_uuidv7;` manually.
4. **Functions** — `erp.current_tenant_id()`, `erp.current_user_id()` in 0001.

### Validation (CI Pipeline)

| Command            | When              | Sync Check                                         |
| ------------------ | ----------------- | -------------------------------------------------- |
| `pnpm db:check`    | Pre-commit, CI    | Snapshot ↔ migrations consistency                  |
| `pnpm db:generate` | After schema edit | Produces new migration if drift                    |
| `pnpm db:ci`       | CI gate           | check + generate dry-run; fails if pending changes |

```bash
# Check schema vs migrations (drift)
pnpm --filter @afenda/db db:check

# Generate migration from schema changes (do not commit without review)
pnpm --filter @afenda/db db:generate

# Full CI gate (used in .github/workflows/ci.yml)
pnpm db:ci

# Migrate (loads .env from root automatically)
pnpm db:migrate

# NEON integration sync (db:check + db:ci + optional env validation)
pnpm neon:sync
pnpm neon:sync:env   # --env: also validate DATABASE_URL pooler, NEON_AUTH_BASE_URL
```

---

## Neon Capabilities Used

| Capability                             | Status | Notes                                        |
| -------------------------------------- | ------ | -------------------------------------------- |
| **PgBouncer pooling**                  | ✅     | `-pooler` endpoint, transaction mode         |
| **Protocol-level prepared statements** | ✅     | `prepare: true` (default), max 1000          |
| **SET LOCAL in transactions**          | ✅     | `app.tenant_id`, `app.user_id` for RLS       |
| **pg_uuidv7**                          | ✅     | DB-native UUIDv7 on Neon PG17                |
| **Branching**                          | ✅     | Preview branches via CI; auth clones with DB |
| **Neon Auth**                          | ✅     | `neon_auth` schema, org multi-tenancy        |
| **Connection pooling**                 | ✅     | Pooled (API/SSR) vs direct (Worker/migrate)  |

---

## Neon Capabilities Available (Not Yet Used)

| Capability                   | Use Case                        | Notes                                               |
| ---------------------------- | ------------------------------- | --------------------------------------------------- |
| **@neondatabase/serverless** | Next.js edge, Vercel serverless | HTTP/WebSocket; better cold-start                   |
| **Neon Data API**            | HTTP queries without driver     | JWT from Neon Auth; RLS via `auth.uid()`            |
| **Branch API**               | CI/CD automation                | `@neondatabase/api-client` for branch create/delete |
| **Read replicas**            | Analytics, reporting            | Dedicated read-only compute                         |
| **Autoscaling**              | Variable load                   | 0.25→8 CU; already configured                       |
| **Scale to zero**            | Idle cost savings               | `suspend_timeout_seconds` in project                |

---

## Connection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Fastify API / Next.js SSR                                       │
│  → createPooledClient(DATABASE_URL)  # -pooler endpoint          │
│  → ?sslmode=verify-full&channel_binding=require&sslnegotiation=direct │
│  → max: 10, prepare: true, idle_timeout: 20s                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Neon PgBouncer (transaction mode)                               │
│  → max_prepared_statements=1000                                  │
│  → SET LOCAL works (transaction-scoped)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Neon Compute (Postgres 17)                                      │
│  → pg_uuidv7, RLS, app.tenant_id / app.user_id                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Graphile Worker / drizzle-kit migrate                           │
│  → createDirectClient(DATABASE_URL_DIRECT)  # no -pooler         │
│  → max: 3 (LISTEN/NOTIFY, migrations)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## RLS Policy Convention

All tenant-scoped tables use:

```sql
USING (tenant_id = erp.current_tenant_id())
WITH CHECK (tenant_id = erp.current_tenant_id());
```

**Do not use** `current_setting('app.current_tenant_id')` — that variable does
not exist. The session sets `app.tenant_id`; `erp.current_tenant_id()` reads it.

---

## Migration Checklist

1. **New tables** — Add to Drizzle schema, run `db:generate`, review SQL.
2. **RLS** — Add policy using `erp.current_tenant_id()` in manual migration.
3. **Extensions** — Add to 0000 or a new migration; run before dependent
   objects.
4. **Grants** — 0001 sets `ALTER DEFAULT PRIVILEGES`; new schemas need explicit
   grants.

---

## Migration File Sync (Active)

| Migration                              | Content                                                                                                                                         | Drizzle Source         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 0000_baseline                          | pg_uuidv7, schemas, enums, baseline tables                                                                                                      | schema/\*.ts           |
| 0001_rls_and_posting_guards            | current_tenant_id(), current_user_id(), RLS, roles, triggers                                                                                    | Manual                 |
| 0002–0005                              | Cost, consolidation, IFRS, controls                                                                                                             | schema/erp\*.ts        |
| 0006_gap_remediation                   | RLS for gap tables                                                                                                                              | Manual                 |
| 0007_better_auth                       | platform.auth\_\* (legacy; superseded by neon_auth)                                                                                             | —                      |
| 0008–0009                              | Auth API key, passkey, 2FA                                                                                                                      | Manual                 |
| 0010_sod_action_log                    | erp.sod_action_log + RLS                                                                                                                        | schema/erp-sod.ts      |
| 0011_approval_workflow                 | erp.approval\_\* + RLS                                                                                                                          | schema/erp-approval.ts |
| 0012_standardize_rls_current_tenant_id | RLS policy standardization (0004, 0006)                                                                                                         | Manual                 |
| 0013_company_rls_and_outbox_index      | `erp.current_company_id()`, company RLS on ledger/gl*journal/ic*\_/revenue\_\_/group*entity/approval*\*, outbox `(tenant_id, created_at)` index | Manual                 |
| 0014_handy_skrulls                     | erp.document_attachment, document_link + RLS                                                                                                     | schema/erp-document.ts |
| 0015_document_file_name_original       | Add `file_name_original` to document_attachment                                                                                                   | schema/erp-document.ts |

---

## Troubleshooting: Schema Drift / Full Dump

If `pnpm db:ci` fails and `db:generate` produces a **full schema dump** (70KB+ SQL)
instead of an incremental migration, the snapshot chain is broken.

**Symptoms:** New migration file contains `CREATE TYPE`, `CREATE TABLE` for
everything — not just your change.

**Cause:** `drizzle/meta/_journal.json` references migrations that don't exist, or
`drizzle/meta/{N}_snapshot.json` is missing for the last applied migration.

**Fix:**

1. Inspect `drizzle/meta/_journal.json` — entries must match existing
   `drizzle/*.sql` files. Remove any entries for migrations that were deleted.
2. Ensure the last migration has a snapshot: `drizzle/meta/{N}_snapshot.json`
   where `{N}` is the index of the last migration (e.g. `0015_snapshot.json`).
3. If the snapshot is missing, run `pnpm db:generate --name=restore_snapshot`,
   then copy the generated `{N+1}_snapshot.json` to `{N}_snapshot.json`, remove
   the generated migration and journal entry, and re-run `pnpm db:ci`.

**Prevention:** Never delete migration files without updating `_journal.json`.
Never delete snapshot files for committed migrations.

---

## Quick Reference: Identical Sync

| From                        | To            | Sync Point                     |
| --------------------------- | ------------- | ------------------------------ |
| Drizzle schema              | SQL migration | `db:generate`                  |
| SQL migration               | DB            | `db:migrate`                   |
| neon_auth                   | App tenantId  | `session.activeOrganizationId` |
| app.tenant_id               | RLS           | `erp.current_tenant_id()`      |
| neon_auth.member            | RBAC          | `DrizzleRoleResolver`          |
| drizzle.config schemaFilter | neon_auth     | Excluded (Neon-managed)        |

## Related Docs

| Doc                                                                | Purpose                                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [NEON-DRIZZLE-BEST-PRACTICES.md](./NEON-DRIZZLE-BEST-PRACTICES.md) | Multi-tenant, multi-company, inter-company, multi-national patterns; industry benchmarks |

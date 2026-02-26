# Neon + Drizzle ORM — Best Practices for Multi-Tenant ERP

Industry-benchmarked patterns for Neon Serverless Postgres with Drizzle ORM,
optimized for **multi-tenancy**, **multi-company**, **inter-company**,
**multi-national**, and **multi-industry** ERP workloads.

---

## 1. Connection Architecture (Neon + Drizzle)

### Connection String Format

| Use Case                     | Endpoint         | Env Var               | Notes                                                      |
| ---------------------------- | ---------------- | --------------------- | ---------------------------------------------------------- |
| **Pooled** (API, SSR)        | `-pooler` suffix | `DATABASE_URL`        | PgBouncer transaction mode; `max_prepared_statements=1000` |
| **Direct** (Worker, migrate) | No `-pooler`     | `DATABASE_URL_DIRECT` | LISTEN/NOTIFY, migrations, long-lived sessions             |

```bash
# Pooled — for Fastify API, Next.js SSR
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require&sslnegotiation=direct"

# Direct — for Graphile Worker, drizzle-kit migrate
DATABASE_URL_DIRECT="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require&sslnegotiation=direct"
```

**Best practice:** Use `sslmode=verify-full` to avoid pg-connection-string
deprecation warnings. Use `ensureNeonConnectionString(url)` — auto-appends
`channel_binding=require`, `sslnegotiation=direct` (Neon AI rules +
connection-latency docs). `sslnegotiation=direct` reduces latency ~100ms for
PG17+ clients.

### Driver Choice

| Runtime                         | Driver                                                  | Drizzle Adapter                    | Rationale                                    |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| Fastify API, Worker             | `postgres.js`                                           | `drizzle-orm/postgres-js`          | Long-running; TCP + pooling; `prepare: true` |
| Next.js Edge, Vercel serverless | `@neondatabase/serverless` (HTTP)                       | `drizzle-orm/neon-http`            | No TCP; single-query optimized               |
| Next.js Node (SSR)              | `postgres.js` or `@neondatabase/serverless` (WebSocket) | `postgres-js` or `neon-serverless` | Transactions supported                       |

**Current @afenda/db:** Uses `postgres.js` for both pooled and direct — correct
for long-running Fastify + Worker.

---

## 2. Multi-Tenancy Patterns

### Hierarchy

```
Tenant (organization)
  └── Company (legal entity, reporting unit)
        └── Ledger (chart of accounts, base currency)
        └── Fiscal Year / Period
  └── User (scoped to tenant)
  └── Currency (tenant-level)
```

### RLS Convention

All tenant-scoped tables:

1. Include `tenant_id uuid NOT NULL`
2. Enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. Policy: `USING (tenant_id = erp.current_tenant_id())` and `WITH CHECK (...)`
4. Use `erp.current_tenant_id()` — wraps `current_setting('app.tenant_id')` with
   null handling

### Session Context

```ts
// Every request/tx MUST set tenant context
await session.withTenant({ tenantId, userId }, async (tx) => {
  // SET LOCAL app.tenant_id, app.user_id, ROLE app_runtime
  return tx.select().from(glJournals)...
});
```

### Index Strategy

**Rule:** Composite indexes MUST be tenant-prefixed for RLS + query performance.

```sql
-- Good: tenant_id first
CREATE INDEX idx_gl_journal_tenant_period_status ON erp.gl_journal (tenant_id, fiscal_period_id, status);
CREATE UNIQUE INDEX uq_company_code_tenant ON platform.company (tenant_id, code);

-- Bad: tenant_id not first (RLS filters first, index less effective)
CREATE INDEX idx_bad ON erp.gl_journal (fiscal_period_id, tenant_id);
```

---

## 3. Multi-Company Patterns

### Company-Scoped Tables

Tables with `company_id` are company-scoped within a tenant. Always filter by
both:

```ts
// Defense-in-depth: tenant + company
.where(and(
  eq(glJournals.tenantId, tenantId),
  eq(glJournals.companyId, companyId)
))
```

### Base Currency

Each company has `base_currency_id`. Ledgers inherit. FX rates are tenant-level.

### Prepared Queries (Hot Path)

Use `.prepare()` for repeated queries — Neon PgBouncer supports protocol-level
prepared statements (up to 1000):

```ts
const listCompanyLedgers = db
  .select({...})
  .from(ledgers)
  .innerJoin(companies, eq(ledgers.companyId, companies.id))
  .where(and(
    eq(ledgers.tenantId, sql.placeholder('tenantId')),
    eq(ledgers.isActive, true)
  ))
  .prepare('list_company_ledgers');
```

---

## 4. Inter-Company Patterns

### IC Agreement / Transaction / Settlement

- `seller_company_id`, `buyer_company_id` — both within same tenant
- `currency_id` — settlement currency
- Paired journal entries (mirror documents) for elimination readiness

### Composite FK Convention

Inter-company tables use `(tenant_id, company_id, ...)` composite FKs for
referential integrity across companies.

---

## 5. Multi-National & International

### Currency & Locale

| Table              | Fields                             | Purpose                                |
| ------------------ | ---------------------------------- | -------------------------------------- |
| `erp.currency`     | `code`, `decimal_places`, `symbol` | ISO 4217; 0–4 decimal places           |
| `platform.company` | `base_currency_id`                 | Company reporting currency             |
| `platform.tenant`  | `settings` (jsonb)                 | `locale`, `timezone`, `defaultCountry` |

### Tax & Jurisdiction

- `country_code` (ISO 3166-1 alpha-2) on tax rules, counterparties
- `jurisdiction_level` enum: FEDERAL, STATE, LOCAL
- Index: `(tenant_id, country_code)` for country-scoped lookups

### FX Rates

- `from_currency_id`, `to_currency_id`, `effective_date`
- Triangulation via base currency
- Revaluation uses `erp.fx_rate`

---

## 6. Schema Organisation

### Schema Filter

`drizzle.config.ts`:

```ts
schemaFilter: ['platform', 'erp', 'audit', 'public'];
```

Industry schemas (if added) go in separate migrations.

### Snapshot Chain Integrity

Drizzle Kit diffs the current schema against the **last snapshot** in
`drizzle/meta/`. The chain is: `0000_snapshot.json` → migrations 0001..N →
`{N}_snapshot.json`.

**Rules:**

- `_journal.json` entries must match existing `drizzle/*.sql` files 1:1.
- Each migration produces a snapshot; the last one (`{N}_snapshot.json`) must
  exist for incremental diffs.
- If the chain breaks (e.g. journal references deleted migrations, or the last
  snapshot is missing), `drizzle-kit generate` falls back to diffing against
  `0000_snapshot.json` and produces a **full schema dump** instead of an
  incremental migration.

**Recovery:** See [NEON-INTEGRATION.md § Troubleshooting](./NEON-INTEGRATION.md#troubleshooting-schema-drift--full-dump).

---

## 7. Neon-Specific Optimizations

### pg_uuidv7

- DB-native UUIDv7: `DEFAULT uuid_generate_v7()`
- Time-ordered for B-tree locality
- `uuid_v7_to_timestamptz(id)` for time-range queries on PKs

### Connection Pool Tuning

| Setting           | Pooled         | Direct  | Rationale                       |
| ----------------- | -------------- | ------- | ------------------------------- |
| `max`             | 10             | 3       | Conservative for Neon 0.25–8 CU |
| `idle_timeout`    | 20             | 20      | Release before Neon suspend     |
| `connect_timeout` | 10             | 10      | Cold-start + autoscale          |
| `max_lifetime`    | 30 min         | 30 min  | PgBouncer server_lifetime       |
| `ssl`             | require        | require | Neon enforces TLS               |
| `prepare`         | true (default) | true    | Protocol-level; do NOT disable  |

### Batch Operations

```ts
// Prefer batch insert over loop
await db.insert(glJournalLines).values(lines).returning();

// Batch select with IN
await db.select().from(accounts).where(inArray(accounts.id, ids));
```

### Transaction Handling

- `SET LOCAL` is transaction-scoped — safe on PgBouncer transaction mode
- Always use `db.transaction()` for multi-statement ops
- `withTenant()` wraps transaction + SET LOCAL

### Connection Resilience (Neon Scale-to-Zero + Compute Restarts)

Neon compute restarts (maintenance, updates, scale-to-zero) cause brief
connection drops. Build resilience:

| Strategy               | Implementation                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| **Connection timeout** | `connect_timeout: 10` (cold start ~500ms; 10s covers worst-case) |
| **Idle timeout**       | `idle_timeout: 20` — release before Neon suspend (5 min default) |
| **Retry logic**        | Exponential backoff + jitter for transient errors                |
| **Idempotency**        | `Idempotency-Key` + `erp.idempotency_store` for write retries    |

**Transient SQLSTATEs** (retry): `57P01` (admin_shutdown), `08006`
(connection_failure), `08003` (connection_does_not_exist).

**Pool lifecycle:** Pools detect stale connections; `max_lifetime: 30min`
rotates connections. See
[Neon: Building resilient applications](https://neon.com/guides/building-resilient-applications-with-postgres).

---

## 8. Industry Benchmarks (AIS / SOX)

| Control               | Implementation                                     |
| --------------------- | -------------------------------------------------- |
| **Tenant isolation**  | RLS on all tables; `erp.current_tenant_id()`       |
| **Double-entry**      | CHECK `(debit=0) <> (credit=0)`; triggers          |
| **Immutability**      | POSTED/REVERSED/VOIDED status; no UPDATE on posted |
| **Audit trail**       | `audit.audit_log`; correlation IDs                 |
| **Idempotency**       | `Idempotency-Key`; `erp.idempotency_store`         |
| **SoD**               | `erp.sod_action_log`; `requireSoD()` in authz      |
| **Approval workflow** | `erp.approval_policy`, `erp.approval_request`      |

---

## 9. Read Replicas (Future)

Neon supports read replicas for analytics/reporting:

- Use `DATABASE_URL_READONLY` for reporting queries
- Trial balance, financial statements, dashboards
- Never use for writes or transactional reads

---

## 10. Branching Strategy

| Branch         | Lifecycle | Use         |
| -------------- | --------- | ----------- |
| `production`   | Permanent | Live        |
| `preview/pr-N` | 1 day     | PR preview  |
| `ci/run-id`    | 1 hour    | CI tests    |
| `dev/user`     | Manual    | Feature dev |

Each branch: isolated compute, cloned storage, own Auth URL.

---

## 11. Neon MCP Integration

The [Neon MCP Server](https://neon.com/docs/ai/neon-mcp-server) lets you manage
Neon projects via natural language in Cursor, VS Code, Claude Code, and other
MCP clients.

### Quick setup

```bash
npx neonctl@latest init
```

This configures the MCP server with API key auth, VS Code extension (where
supported), and installs
[Neon agent skills](https://github.com/neondatabase/agent-skills).

### MCP tools (when connected)

| Category        | Tools                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Projects**    | `list_projects`, `create_project`, `describe_project`                                         |
| **Branches**    | `create_branch`, `delete_branch`, `compare_database_schema`, `reset_from_parent`              |
| **SQL**         | `run_sql`, `run_sql_transaction`, `get_database_tables`, `describe_table_schema`              |
| **Migrations**  | `prepare_database_migration`, `complete_database_migration`                                   |
| **Performance** | `list_slow_queries`, `explain_sql_statement`, `prepare_query_tuning`, `complete_query_tuning` |

**Usage:** `"List my Neon projects"`, `"Show tables in database 'main'"`,
`"Explain SELECT * FROM erp.gl_journal"`.

**Security:** MCP is for **development/testing only**. Never connect to
production. Review LLM-requested actions before execution.

---

## Quick Reference

| Pattern                  | Location                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| Tenant context           | `session.withTenant()`                                                   |
| Tenant + company context | `session.withTenantAndCompany()`                                         |
| RLS helper               | `erp.current_tenant_id()`                                                |
| Prepared queries         | `createPreparedQueries(db)`                                              |
| Connection factories     | `createPooledClient`, `createDirectClient`, `createReadOnlyClient`       |
| Connection string helper | `ensureNeonConnectionString(url)`                                        |
| Transient retry          | `withRetry(fn, opts)` — health check uses it                             |
| Schema helpers           | `pkId()`, `tenantCol()`, `companyCol()`, `timestamps()`, `moneyBigint()` |

---

## Implementation Status

| Item                                                | Status | Notes                                                                                               |
| --------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `channel_binding=require` + `sslnegotiation=direct` | ✅     | `ensureNeonConnectionString()` auto-appends; used by pooled/direct clients                          |
| `createReadOnlyClient`                              | ✅     | Returns `DbClient \| null` when URL empty; use `DATABASE_URL_READONLY`                              |
| `withTenantAndCompany`                              | ✅     | Sets `app.tenant_id`, `app.company_id`, `app.user_id`; defense-in-depth                             |
| `companyCol()` schema helper                        | ✅     | `packages/db/src/schema/_common.ts`                                                                 |
| Prepared queries (incl. inter-company)              | ✅     | `findIcAgreementByPair`, etc. in `createPreparedQueries(db)`                                        |
| Tenant-prefixed indexes                             | ✅     | Audited in `erp.ts`; `idx_*` use `tenant_id` first                                                  |
| RLS + `erp.current_tenant_id()`                     | ✅     | Migrations 0001, 0004, 0006, 0010, 0011, 0012                                                       |
| Connection resilience                               | ✅     | `connect_timeout: 10`, `idle_timeout: 20`; `withRetry()` for transient errors; health check retries |
| Neon MCP alignment                                  | ✅     | Doc section 11; `npx neonctl init` for Cursor/VS Code                                               |
| `erp.current_company_id()` + company RLS            | ✅     | Migration 0013; company-scoped tables enforce company boundary                                      |
| Outbox `(tenant_id, created_at)` index              | ✅     | Migration 0013; tenant-isolated drains                                                              |
| Read replica wiring                                 | ✅     | `DATABASE_URL_READONLY` in config; `createReadOnlyClient` in API                                    |
| `sslmode=verify-full`                               | ✅     | `DATABASE_SSL_MODE=verify-full` env; `ConnectionOptions.sslMode`                                    |
| Neon branching                                      | ✅     | `scripts/neon-branch-setup.md`                                                                      |
| `uuidV7ToTimestamp()`                               | ✅     | `packages/db/src/schema/_common.ts`                                                                 |

### References

- [Neon Connect Securely](https://neon.com/docs/connect/connect-securely)
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon Connection Latency](https://neon.com/docs/connect/connection-latency)
- [Neon Read Replicas](https://neon.com/docs/introduction/read-replicas)
- [Neon MCP Server](https://neon.com/docs/ai/neon-mcp-server)
- [Neon Drizzle AI Rules](https://neon.com/docs/ai/ai-rules-neon-drizzle)

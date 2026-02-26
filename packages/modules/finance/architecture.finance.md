# @afenda/finance — Enterprise Finance Module Spec (v1.1)

The General Ledger kernel and posting engine for a multi-tenant, multi-company,
intercompany, multi-national ERP. Finance is the spine — every domain eventually
produces posted journals that feed the ledger.

### Posting Engine Ownership (North Star)

> **The Posting Engine = App Orchestration + DB Enforcement.**
>
> The **app layer** (`postJournal()`, `reverseJournal()`, etc.) orchestrates the
> posting workflow: idempotency claims, repo calls, status transitions, outbox
> writes, and user-friendly validation errors. The **DB layer** (`@afenda/db`
> triggers + RLS) is the hard backstop that guarantees invariants under
> concurrency — balance checks at commit time, line/header immutability after
> POSTED, and tenant isolation. App validation must never become "required for
> correctness." The DB is always the final authority. No posting logic may live
> in route handlers or worker jobs.

---

## Current State Assessment

| Layer                   | Status      | Detail                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **domain/**             | ✅ Complete | 11 entity files: Journal, Account, FiscalPeriod, Ledger, FxRate, GlBalance, JournalAudit, Intercompany, RecurringTemplate, Budget, FinancialReports                                                                                                                                                     |
| **app/ports/**          | ✅ Complete | 13 ports: IJournalRepo, IAccountRepo, IFiscalPeriodRepo, IGlBalanceRepo, IIdempotencyStore, IOutboxWriter, IJournalAuditRepo, IFxRateRepo, ILedgerRepo, IIcAgreementRepo+IIcTransactionRepo, IRecurringTemplateRepo, IBudgetRepo, FinanceRuntime (14 deps)                                              |
| **app/services/**       | ✅ Complete | 14 services: postJournal, createJournal, getJournal, reverseJournal, voidJournal, getTrialBalance, closePeriod, lockPeriod, reopenPeriod, createIcTransaction, processRecurringJournals, getBudgetVariance, getBalanceSheet, getIncomeStatement                                                         |
| **infra/mappers/**      | ✅ Complete | 3 mappers: journal-mapper, account-mapper, period-mapper                                                                                                                                                                                                                                                |
| **infra/repositories/** | ✅ Complete | 13 repos: DrizzleJournalRepo, DrizzleAccountRepo, DrizzlePeriodRepo, DrizzleBalanceRepo, DrizzleIdempotencyStore, DrizzleOutboxWriter, DrizzleJournalAuditRepo, DrizzleFxRateRepo, DrizzleLedgerRepo, DrizzleIcAgreementRepo, DrizzleIcTransactionRepo, DrizzleRecurringTemplateRepo, DrizzleBudgetRepo |
| **infra/routes/**       | ✅ Complete | 11 route registrars + error-mapper + fastify-plugins: journal (5), account (2), period (7), balance (1), ic-transactions (2), ic-agreements (2), ledgers (2), fx-rates (1), recurring-templates (4), budget (3), reports (2) = 31 endpoints                                                             |
| **infra/runtime**       | ✅ Complete | DrizzleFinanceRuntime — composition root wiring 14 repos via session.withTenant()                                                                                                                                                                                                                       |
| **public.ts**           | ✅ Complete | Barrel export of all domain types, ports, services, repos, routes, runtime, mappers                                                                                                                                                                                                                     |
| **Governance**          | ✅ Clean    | typecheck passes, 121 unit tests (17 files) + 50 route tests + 19 integration tests                                                                                                                                                                                                                     |
| **Cross-cutting**       | ✅ Wired    | `apps/api` registers all 31 finance endpoints + 2 health endpoints (33 total). `apps/worker` drains `erp.outbox` via Graphile Worker cron + `EventHandlerRegistry` (7 handlers). `@afenda/db` exports `createOutboxDrainer`, `createHealthCheck`.                                                       |

**All I0–I12 phases + P3 implemented. P0/P1/P2/P3 ALL DONE.** `@afenda/db` v4
Neon-optimized is the backing store. Infra layer uses real Drizzle queries +
tenant-scoped transactions. Multi-currency FX enforcement + conversion,
intercompany paired journals, recurring journals, budget vs. actual, financial
reporting (balance sheet + income statement), outbox drain via Graphile Worker,
7 structured event handlers, and full test suite complete. Only Drizzle
migration generation remains.

---

## Architecture Principles

### Hexagonal / Ports & Adapters (PROJECT.md §7)

```
┌─────────────────────────────────────────────────────┐
│  public.ts  (the ONLY import surface for consumers) │
├─────────────────────────────────────────────────────┤
│                                                     │
│  domain/          Pure business rules               │
│  ├── entities/    Value objects + aggregates         │
│  └── index.ts     Domain barrel                     │
│                                                     │
│  app/             Use-cases + port interfaces        │
│  ├── ports/       IJournalRepo, IAccountRepo, ...   │
│  ├── services/    postJournal, reverseJournal, ...   │
│  └── index.ts     App barrel                        │
│                                                     │
│  infra/           Adapters (DB + HTTP)              │
│  ├── repositories/  Drizzle implementations         │
│  ├── routes/        Fastify route handlers          │
│  └── index.ts       Infra barrel                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dependency Rule (Strict)

| From                    | May Import                                                            | NEVER Imports                                                |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `domain/**`             | `@afenda/core` only                                                   | `app/**`, `infra/**`, `drizzle-orm`, `fastify`, `@afenda/db` |
| `app/**`                | `domain/**`, `@afenda/core`                                           | `infra/**`, `drizzle-orm`, `fastify`, `@afenda/db`           |
| `infra/repositories/**` | `domain/**`, `app/**`, `@afenda/core`, `@afenda/db`, `drizzle-orm`    | `fastify`                                                    |
| `infra/routes/**`       | `domain/**`, `app/**`, `@afenda/core`, `@afenda/contracts`, `fastify` | `drizzle-orm`, `@afenda/db`                                  |

### Finance Fact Immutability (PROJECT.md §9 — Non-Negotiable)

| Rule                              | Implementation                                                   |
| --------------------------------- | ---------------------------------------------------------------- |
| No UPDATE on posted journal lines | DB trigger in `0005_posting_guards.sql`                          |
| No DELETE on any journal          | Soft-delete via status (VOIDED)                                  |
| Reversal creates a new journal    | `reverseJournal()` service creates mirror entry                  |
| Period close forbids posting      | `postJournal()` checks period status                             |
| All mutations are idempotent      | `IIdempotencyStore` with `(tenant_id, key, command_type)` unique |

---

## Domain Layer — What Exists (Retained)

### Entities

| Entity                     | File               | Key Fields                                               | Notes                                                                                                    |
| -------------------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Journal`                  | `journal.ts`       | id, companyId, ledgerId, status, lines[], date           | Aggregate root. Status: DRAFT→POSTED→REVERSED/VOIDED                                                     |
| `JournalLine`              | `journal.ts`       | accountId, accountCode, debit (Money), credit (Money)    | Value object. `accountId` for DB writes, `accountCode` for display. `(debit=0) <> (credit=0)` invariant. |
| `Account`                  | `account.ts`       | id, companyId, code, name, type, parentId                | 5 types: ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE                                                          |
| `FiscalPeriod`             | `fiscal-period.ts` | id, companyId, name, range (DateRange), status           | Status: OPEN/CLOSED/LOCKED                                                                               |
| `Ledger`                   | `ledger.ts`        | id, companyId, name, baseCurrency, isDefault             | One default ledger per company                                                                           |
| `FxRate`                   | `fx-rate.ts`       | fromCurrency, toCurrency, rate, effectiveDate            | `convertAmount()` function exported                                                                      |
| `GlBalance`                | `gl-balance.ts`    | ledgerId, accountCode, periodId, debitTotal, creditTotal | Materialized balance per account per period                                                              |
| `TrialBalance`             | `gl-balance.ts`    | rows[], totalDebits, totalCredits, isBalanced            | Read model for reporting                                                                                 |
| `IntercompanyRelationship` | `intercompany.ts`  | sellerCompanyId, buyerCompanyId, pricingRule             | IC agreement between two companies                                                                       |
| `IntercompanyDocument`     | `intercompany.ts`  | sourceJournalId, mirrorJournalId, status                 | Paired journals across companies                                                                         |

### Domain Rules (Enforced in `postJournal()`)

1. **Balanced journal** — `sum(debits) === sum(credits)` (bigint exact)
2. **Minimum 2 lines** — double-entry requires at least debit + credit
3. **DRAFT only** — can only post journals in DRAFT status
4. **Idempotency** — atomic `claimOrGet()` prevents double-posting under
   concurrency
5. **Period must be OPEN** — journal's `postingDate` must fall within exactly
   one OPEN fiscal period for that ledger's company. Non-negotiable.
6. **postingDate within period range** —
   `period.startDate <= journal.postingDate <= period.endDate`

### Validation Responsibility Split

| Check             | App Layer (user-friendly errors)        | DB Layer (hard backstop)                           |
| ----------------- | --------------------------------------- | -------------------------------------------------- |
| Balanced journal  | `postJournal()` pre-check               | DEFERRABLE AFTER trigger at commit                 |
| Min 2 lines       | `postJournal()` pre-check               | —                                                  |
| Status is DRAFT   | `postJournal()` pre-check               | BEFORE trigger rejects non-DRAFT                   |
| Period is OPEN    | `postJournal()` via `IFiscalPeriodRepo` | —                                                  |
| Line immutability | —                                       | BEFORE trigger on UPDATE/DELETE                    |
| Tenant isolation  | `session.withTenant()`                  | RLS policies (FORCE)                               |
| Idempotency       | `IIdempotencyStore.claimOrGet()`        | UNIQUE constraint `(tenant_id, key, command_type)` |

**Rule:** App validation provides early, user-friendly errors. DB enforcement is
the final authority under concurrency. Neither layer alone is sufficient.

---

## App Layer — What Exists + What's Needed

### Services (All Implemented)

| Service                 | File                       | Status      | Description                                                                                                               |
| ----------------------- | -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `postJournal()`         | `post-journal.ts`          | ✅ Complete | Posts DRAFT→POSTED with balance validation + atomic claimOrGet() idempotency + outbox write                               |
| `createJournal()`       | `create-journal.ts`        | ✅ Complete | Creates DRAFT journal. Resolves `accountCode → accountId` via `IAccountRepo`. Validates period is OPEN for `postingDate`. |
| `getJournal()`          | `get-journal.ts`           | ✅ Complete | Fetches journal by ID with lines via `IJournalRepo.findById()`.                                                           |
| `reverseJournal()`      | `reverse-journal.ts`       | ✅ Complete | Creates mirror journal with swapped debits/credits. Sets original to REVERSED. Idempotent via claimOrGet().               |
| `voidJournal()`         | `void-journal.ts`          | ✅ Complete | Sets DRAFT journal to VOIDED. Rejects POSTED journals (must reverse instead).                                             |
| `getTrialBalance()`     | `get-trial-balance.ts`     | ✅ Complete | Aggregates GL balances for a ledger + period into `TrialBalance` read model.                                              |
| `closePeriod()`         | `close-period.ts`          | ✅ Complete | Sets period to CLOSED. Rejects if DRAFT journals remain. Outbox write.                                                    |
| `lockPeriod()`          | `lock-period.ts`           | ✅ Complete | Sets CLOSED period to LOCKED (permanent). Rejects OPEN or already LOCKED. Outbox write.                                   |
| `reopenPeriod()`        | `reopen-period.ts`         | ✅ Complete | Sets CLOSED period back to OPEN. Rejects LOCKED (permanent) and OPEN (no-op). Outbox write.                               |
| `createIcTransaction()` | `create-ic-transaction.ts` | ✅ Complete | Validates IC agreement is active. Creates paired source+mirror journals. Creates IC document linking both. Outbox write.  |

### Ports (All Implemented)

| Port                 | File                    | Status      | Methods                                                                                      |
| -------------------- | ----------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `IJournalRepo`       | `journal-repo.ts`       | ✅ Complete | `findById(id)`, `save(journal)`, `create(input)`, `findByPeriod(periodId, status?)`          |
| `IAccountRepo`       | `account-repo.ts`       | ✅ Complete | `findByCode(companyId, code)`, `findById(id)`                                                |
| `IFiscalPeriodRepo`  | `fiscal-period-repo.ts` | ✅ Complete | `findById(id)`, `findOpenByDate(companyId, date)`, `close(id)`                               |
| `IGlBalanceRepo`     | `gl-balance-repo.ts`    | ✅ Complete | `getTrialBalance(ledgerId, year, period?)`                                                   |
| `IOutboxWriter`      | `outbox-writer.ts`      | ✅ Complete | `write(event)`                                                                               |
| `IIdempotencyStore`  | `idempotency-store.ts`  | ✅ Complete | `claimOrGet(input)` — atomic `INSERT ON CONFLICT DO NOTHING` + SELECT                        |
| `IJournalAuditRepo`  | `journal-audit-repo.ts` | ✅ Complete | `log(input)` — audit trail for journal lifecycle events                                      |
| `IFxRateRepo`        | `fx-rate-repo.ts`       | ✅ Complete | `findRate(fromCurrency, toCurrency, effectiveDate)` — FX rate lookup by currency pair + date |
| `ILedgerRepo`        | `ledger-repo.ts`        | ✅ Complete | `findById(id)` — returns Ledger with baseCurrency resolved via currency join                 |
| `IIcAgreementRepo`   | `ic-repo.ts`            | ✅ Complete | `findById(id)`, `findByCompanyPair(seller, buyer)` — IC agreement lookup                     |
| `IIcTransactionRepo` | `ic-repo.ts`            | ✅ Complete | `create(input)`, `findById(id)` — IC document with transaction legs                          |
| `FinanceRuntime`     | `finance-runtime.ts`    | ✅ Complete | `withTenant(ctx, fn)` — composition root contract for routes (12 deps)                       |

---

## Infra Layer — Implementation Plan

### Repositories (Drizzle + `@afenda/db`)

All repositories receive a `TenantTx` (from `session.withTenant()`) — NOT a raw
`DbClient`. This ensures every query runs inside a tenant-scoped transaction
with RLS enforced.

#### `DrizzleJournalRepo` — Real Implementation

```ts
import { eq, and } from 'drizzle-orm';
import { glJournals, glJournalLines } from '@afenda/db';
import type { TenantContext } from '@afenda/db';

export class DrizzleJournalRepo implements IJournalRepo {
  constructor(private readonly tx: TenantTx) {}

  async findById(id: string): Promise<Result<Journal>> {
    const row = await this.tx.query.glJournals.findFirst({
      where: eq(glJournals.id, id),
      with: { lines: true },
    });
    if (!row) return err(new NotFoundError('Journal', id));
    return ok(mapToDomain(row));
  }

  async save(journal: Journal): Promise<Result<Journal>> {
    const [updated] = await this.tx
      .update(glJournals)
      .set({ status: journal.status, updatedAt: new Date() })
      .where(eq(glJournals.id, journal.id))
      .returning();
    return ok(mapToDomain({ ...updated, lines: journal.lines }));
  }

  async create(input: CreateJournalInput): Promise<Result<Journal>> {
    // Insert journal + lines in same transaction
    // Outbox write for JOURNAL_CREATED event
  }
}
```

#### `DrizzleAccountRepo` — Real Implementation

```ts
export class DrizzleAccountRepo implements IAccountRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByCode(companyId: string, code: string): Promise<Result<Account>> {
    // Uses composite index: uq_account_code_tenant
  }

  async findById(id: string): Promise<Result<Account>> {
    // Direct PK lookup
  }
}
```

#### `DrizzleIdempotencyStore` — New (Atomic)

```ts
export interface IdempotencyClaimInput {
  tenantId: string;
  key: string;
  commandType: string;
  resultRef?: string;
}

export type IdempotencyResult =
  | { ok: true; claimed: true }
  | { ok: true; claimed: false; resultRef?: string };

// Atomic: INSERT ... ON CONFLICT DO NOTHING, then SELECT existing if not inserted.
// Prevents check-then-insert race under concurrency.
export class DrizzleIdempotencyStore implements IIdempotencyStore {
  constructor(private readonly tx: TenantTx) {}

  async claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult> {
    // 1. Try INSERT ... ON CONFLICT (tenant_id, key, command_type) DO NOTHING RETURNING *
    // 2. If row returned → we claimed it: { ok: true, claimed: true }
    // 3. If no row returned → already exists: SELECT result_ref → { ok: true, claimed: false, resultRef }
  }
}
```

#### `DrizzleOutboxWriter` — New

```ts
import { outbox } from '@afenda/db';

export class DrizzleOutboxWriter implements IOutboxWriter {
  constructor(private readonly tx: TenantTx) {}

  async write(event: OutboxEvent): Promise<void> {
    await this.tx.insert(outbox).values({
      tenantId: event.tenantId,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
    });
  }
}
```

### Routes (Fastify + `@afenda/contracts`)

Routes are thin HTTP adapters. They **must NOT import `@afenda/db` or
`drizzle-orm`** (dependency rule). Instead, routes receive a `FinanceRuntime` —
a composition-root-injected dependency that provides tenant-scoped service
execution.

Routes:

1. Parse + validate request with Zod schemas from `@afenda/contracts`
2. Extract tenant context from request headers (`x-tenant-id`, `x-user-id`,
   `Idempotency-Key`)
3. Call the appropriate service via `FinanceRuntime`
4. Map `Result<T>` → HTTP response (200/201/400/404/409/500)

#### Required Headers for Write Endpoints

| Header            | Required For                        | Notes                                                                       |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `x-tenant-id`     | **All endpoints**                   | Tenant isolation                                                            |
| `x-user-id`       | **All write endpoints**             | `erp.current_user_id()` trigger sets `posted_by`. Omitting causes DB error. |
| `Idempotency-Key` | `POST .../post`, `POST .../reverse` | Exactly-once semantics                                                      |

#### `FinanceRuntime` — Composition Root Dependency

```ts
// Defined in app/ports/ — NOT in infra
export interface FinanceRuntime {
  /** Execute a tenant-scoped operation. The runtime handles session.withTenant() internally. */
  withTenant<T>(
    ctx: { tenantId: string; userId: string },
    fn: (deps: FinanceDeps) => Promise<T>
  ): Promise<T>;
}

export interface FinanceDeps {
  journalRepo: IJournalRepo;
  accountRepo: IAccountRepo;
  periodRepo: IFiscalPeriodRepo;
  balanceRepo: IGlBalanceRepo;
  idempotencyStore: IIdempotencyStore;
  outboxWriter: IOutboxWriter;
  journalAuditRepo: IJournalAuditRepo;
  fxRateRepo: IFxRateRepo;
  ledgerRepo: ILedgerRepo;
  icAgreementRepo: IIcAgreementRepo;
  icTransactionRepo: IIcTransactionRepo;
}
```

The `FinanceRuntime` is created in `apps/api` composition root (where
`@afenda/db` is allowed) and injected into routes. Routes never see `DbClient`,
`TenantTx`, or Drizzle.

#### `registerJournalRoutes()` — Real Implementation

```ts
import type { FastifyInstance } from 'fastify';
import {
  CreateJournalSchema,
  PostJournalSchema,
  IdParamSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../app/ports/finance-runtime.js';

export function registerJournalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime
): void {
  // POST /journals — create draft
  app.post('/journals', async (req, reply) => {
    const body = CreateJournalSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string; // REQUIRED for writes

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return createJournal(body, deps);
      }
    );

    return result.ok
      ? reply.status(201).send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  });

  // POST /journals/:id/post — post a draft (idempotent)
  app.post('/journals/:id/post', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return postJournal({ tenantId, journalId: id, idempotencyKey }, deps);
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  });

  // POST /journals/:id/reverse — reverse a posted journal (idempotent)
  app.post('/journals/:id/reverse', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return reverseJournal(
          { tenantId, journalId: id, idempotencyKey },
          deps
        );
      }
    );

    return result.ok
      ? reply.status(201).send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  });

  // POST /journals/:id/void — void a draft journal
  app.post('/journals/:id/void', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return voidJournal({ journalId: id }, deps);
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  });

  // GET /journals/:id — get by ID (read — userId optional)
  app.get('/journals/:id', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req.headers['x-user-id'] as string) ?? 'system';

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return deps.journalRepo.findById(id);
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  });
}
```

#### Error Mapping

```ts
function mapErrorToStatus(error: AppError): number {
  switch (error.code) {
    case 'NOT_FOUND':
      return 404;
    case 'ACCOUNT_NOT_FOUND':
      return 404;
    case 'VALIDATION':
      return 400;
    case 'INVALID_STATE':
      return 409;
    case 'IDEMPOTENCY_CONFLICT':
      return 409;
    case 'UNBALANCED_JOURNAL':
      return 422;
    case 'INSUFFICIENT_LINES':
      return 422;
    case 'PERIOD_NOT_OPEN':
      return 422;
    case 'FORBIDDEN':
      return 403;
    default:
      return 500;
  }
}
```

---

## Domain ↔ DB Mapping

Domain entities are pure TypeScript interfaces. The infra layer maps between
domain types and Drizzle row types from `@afenda/db`.

| Domain Entity              | DB Table (`@afenda/db`)                         | Key Mapping Notes                                                                                                                                                        |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Journal`                  | `erp.gl_journal` + `erp.gl_journal_line`        | Aggregate: journal + lines loaded together. `Money` → `bigint` via `moneyBigint`.                                                                                        |
| `JournalLine`              | `erp.gl_journal_line`                           | `accountCode` resolved from `accountId` via join or lookup                                                                                                               |
| `Account`                  | `erp.account`                                   | Direct 1:1 mapping. `type` → `accountType` enum.                                                                                                                         |
| `FiscalPeriod`             | `erp.fiscal_period`                             | `range` → `startDate` + `endDate`. `status` → `periodStatusEnum`.                                                                                                        |
| `Ledger`                   | `erp.ledger`                                    | `baseCurrency` → resolved from `currencyId` join.                                                                                                                        |
| `FxRate`                   | `erp.fx_rate`                                   | Currency pair + effective date + rate. Unique on `(tenantId, fromCurrencyId, toCurrencyId, effectiveDate)`. `DrizzleFxRateRepo` resolves currency codes to IDs via join. |
| `GlBalance`                | `erp.gl_balance`                                | Composite PK. `debitTotal`/`creditTotal` → `debitBalance`/`creditBalance`.                                                                                               |
| `IntercompanyRelationship` | `erp.ic_agreement`                              | `pricingRule` → `pricing` enum. `markupPercent` not in DB yet.                                                                                                           |
| `IntercompanyDocument`     | `erp.ic_transaction` + `erp.ic_transaction_leg` | `sourceJournalId`/`mirrorJournalId` → leg journal references.                                                                                                            |

### Mapper Pattern

```ts
// infra/mappers/journal-mapper.ts
import type { Journal, JournalLine } from '../../domain/index.js';
import type { GlJournal, GlJournalLine } from '@afenda/db';

export function mapJournalToDomain(
  row: GlJournal & { lines: GlJournalLine[] }
): Journal {
  return {
    id: row.id,
    companyId: companyId(/* resolve from ledger */),
    ledgerId: ledgerId(row.ledgerId),
    description: row.description ?? '',
    date: row.postingDate,
    status: row.status,
    lines: row.lines.map(mapLineToDomain),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
```

---

## Outbox Events (Async via Worker)

All state-changing operations write to `erp.outbox` inside the same transaction.
The Worker drains the outbox via Graphile cron.

| Event                    | Trigger                              | Payload                                                           | Notes                                                                                                                                              |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOURNAL_CREATED`        | `createJournal()`                    | `{ journalId, ledgerId, companyId }`                              |                                                                                                                                                    |
| `JOURNAL_POSTED`         | `postJournal()`                      | `{ journalId, ledgerId, companyId }`                              | GL balances UPSERTed in same tx                                                                                                                    |
| `JOURNAL_REVERSED`       | `reverseJournal()`                   | `{ journalId, reversalId, ledgerId }`                             | Mirror journal created in same tx                                                                                                                  |
| `PERIOD_CLOSED`          | `closePeriod()`                      | `{ periodId, fiscalYearId }`                                      |                                                                                                                                                    |
| `PERIOD_LOCKED`          | `lockPeriod()`                       | `{ periodId }`                                                    | Permanent — cannot be reopened                                                                                                                     |
| `PERIOD_REOPENED`        | `reopenPeriod()`                     | `{ periodId }`                                                    | Only from CLOSED, not LOCKED                                                                                                                       |
| `IC_TRANSACTION_CREATED` | `createIcTransaction()`              | `{ icDocumentId, agreementId, sourceJournalId, mirrorJournalId }` | Paired journals created in same tx                                                                                                                 |
| `GL_BALANCE_CHANGED`     | `postJournal()` / `reverseJournal()` | `{ ledgerId, accountIds[], periodId }`                            | **Notification only** — balances already computed in posting tx. Worker uses this to invalidate caches/trigger reporting, NOT to compute balances. |

---

## File Structure — Target

```
packages/modules/finance/
├── src/
│   ├── public.ts                          # ONLY entrypoint
│   ├── domain/
│   │   ├── index.ts                       # Domain barrel
│   │   └── entities/
│   │       ├── journal.ts                 # ✅ Journal + JournalLine
│   │       ├── account.ts                 # ✅ Account + AccountType
│   │       ├── fiscal-period.ts           # ✅ FiscalPeriod + PeriodStatus
│   │       ├── ledger.ts                  # ✅ Ledger
│   │       ├── fx-rate.ts                 # ✅ FxRate + convertAmount()
│   │       ├── gl-balance.ts              # ✅ GlBalance + TrialBalance
│   │       └── intercompany.ts            # ✅ IC Relationship + Document
│   ├── app/
│   │   ├── index.ts                       # App barrel
│   │   ├── ports/
│   │   │   ├── journal-repo.ts            # ✅ IJournalRepo (extended: create, findByPeriod)
│   │   │   ├── account-repo.ts            # ✅ IAccountRepo
│   │   │   ├── fiscal-period-repo.ts      # ✅ IFiscalPeriodRepo
│   │   │   ├── gl-balance-repo.ts         # ✅ IGlBalanceRepo
│   │   │   ├── outbox-writer.ts           # ✅ IOutboxWriter
│   │   │   ├── idempotency-store.ts       # ✅ IIdempotencyStore (atomic claimOrGet)
│   │   │   ├── journal-audit-repo.ts      # ✅ IJournalAuditRepo
│   │   │   ├── fx-rate-repo.ts            # ✅ IFxRateRepo (findRate by currency pair + date)
│   │   │   ├── ledger-repo.ts             # ✅ ILedgerRepo (findById with baseCurrency)
│   │   │   ├── ic-repo.ts                 # ✅ IIcAgreementRepo + IIcTransactionRepo
│   │   │   └── finance-runtime.ts         # ✅ FinanceRuntime + FinanceDeps (12 repos)
│   │   └── services/
│   │       ├── post-journal.ts            # ✅ postJournal() — claimOrGet + FX rate enforcement + outbox
│   │       ├── create-journal.ts          # ✅ createJournal() — accountCode→accountId
│   │       ├── get-journal.ts             # ✅ getJournal()
│   │       ├── reverse-journal.ts         # ✅ reverseJournal() — mirror + idempotency
│   │       ├── void-journal.ts            # ✅ voidJournal() — DRAFT only
│   │       ├── get-trial-balance.ts       # ✅ getTrialBalance()
│   │       ├── close-period.ts            # ✅ closePeriod() — rejects DRAFT journals
│   │       ├── lock-period.ts             # ✅ lockPeriod() — CLOSED→LOCKED only
│   │       ├── reopen-period.ts           # ✅ reopenPeriod() — CLOSED→OPEN only
│   │       └── create-ic-transaction.ts   # ✅ createIcTransaction() — paired journals + IC doc
│   └── infra/
│       ├── index.ts                       # Infra barrel
│       ├── drizzle-finance-runtime.ts     # ✅ Composition root — wires all 12 repos per-tx
│       ├── mappers/
│       │   ├── journal-mapper.ts          # ✅ DB row ↔ domain Journal
│       │   ├── account-mapper.ts          # ✅ DB row ↔ domain Account
│       │   └── period-mapper.ts           # ✅ DB row ↔ domain FiscalPeriod
│       ├── repositories/
│       │   ├── drizzle-journal-repo.ts    # ✅ Real: findById (with lines+account), save, create, findByPeriod
│       │   ├── drizzle-account-repo.ts    # ✅ findByCode, findById
│       │   ├── drizzle-period-repo.ts     # ✅ findById, findOpenByDate, close
│       │   ├── drizzle-balance-repo.ts    # ✅ getTrialBalance from composite PK
│       │   ├── drizzle-idempotency.ts     # ✅ Advisory lock + INSERT ON CONFLICT DO NOTHING
│       │   ├── drizzle-outbox-writer.ts   # ✅ Insert to erp.outbox
│       │   ├── drizzle-journal-audit-repo.ts # ✅ Audit trail logging
│       │   ├── drizzle-fx-rate-repo.ts    # ✅ FX rate lookup with currency code→ID join
│       │   ├── drizzle-ledger-repo.ts     # ✅ Ledger with baseCurrency via currency join
│       │   └── drizzle-ic-repo.ts         # ✅ IC agreement + transaction + legs
│       └── routes/
│           ├── journal-routes.ts          # ✅ 5 endpoints via FinanceRuntime
│           ├── account-routes.ts          # ✅ GET /accounts, GET /accounts/:id
│           ├── period-routes.ts           # ✅ GET /periods, POST close/lock/reopen
│           ├── balance-routes.ts          # ✅ GET /trial-balance
│           ├── ic-routes.ts               # ✅ POST /ic-transactions, GET /ic-transactions/:id
│           ├── ledger-routes.ts           # ✅ GET /ledgers, GET /ledgers/:id
│           ├── fx-rate-routes.ts          # ✅ GET /fx-rates?from=&to=&date=
│           ├── error-mapper.ts            # ✅ AppError → HTTP status
│           └── fastify-plugins.ts         # ✅ Error handler + BigInt serializer
│   └── __tests__/
│       ├── helpers.ts                     # Domain factories + mock repos (12 mocks)
│       ├── create-journal.test.ts         # 5 tests
│       ├── post-journal.test.ts           # 12 tests (incl. 3 multi-currency)
│       ├── reverse-journal.test.ts        # 6 tests
│       ├── void-journal.test.ts           # 4 tests
│       ├── close-period.test.ts           # 4 tests
│       ├── lock-period.test.ts            # 4 tests
│       ├── reopen-period.test.ts          # 4 tests
│       ├── get-journal.test.ts            # 2 tests
│       ├── get-trial-balance.test.ts      # 2 tests
│       ├── idempotency.test.ts            # 6 tests (incl. race condition)
│       ├── create-ic-transaction.test.ts  # 5 tests
│       ├── routes.test.ts                 # 35 HTTP tests (Fastify inject)
│       └── integration.test.ts            # 19 tests (requires DATABASE_URL)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json                     # Covers test files with ES2022 target
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js
├── ARCHITECTURE.@afenda-modules-finance.md
└── architecture.finance.md               # This file
```

---

## Implementation Order

| Phase    | Files                                                                         | Status  | Validates                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I0**   | This spec (v1.1 fixes)                                                        | ✅ Done | All DB table names match `@afenda/db` schema. FX status clarified. GL_BALANCE ownership defined. Route dependency rule clean.                                                    |
| **I1**   | `infra/mappers/*`                                                             | ✅ Done | Typecheck — domain ↔ DB mapping compiles. `JournalLine` carries both `accountId` + `accountCode`. `Journal` carries `fiscalPeriodId`.                                            |
| **I2**   | `DrizzleJournalRepo` (real)                                                   | ✅ Done | `findById` (with lines+account+ledger), `save` (status only), `create` (journal+lines), `findByPeriod`                                                                           |
| **I2.5** | `IIdempotencyStore` port, `DrizzleIdempotencyStore`, refactor `postJournal()` | ✅ Done | Atomic `claimOrGet()`. `postJournal()` uses port.                                                                                                                                |
| **I3**   | `DrizzleAccountRepo`, `DrizzleOutboxWriter`                                   | ✅ Done | Account lookup by code/id/all. Outbox row written in same tx.                                                                                                                    |
| **I4**   | `FinanceRuntime` port + `DrizzleFinanceRuntime` impl                          | ✅ Done | Runtime wires all 12 repos (journal, account, period, balance, idempotency, outbox, audit, fxRate, ledger, icAgreement, icTransaction) via `session.withTenant()`                |
| **I5**   | `createJournal()`, `getJournal()` services                                    | ✅ Done | accountCode→accountId resolution, period-open validation, outbox write                                                                                                           |
| **I6**   | `reverseJournal()`, `voidJournal()` services                                  | ✅ Done | Mirror journal with swapped debits/credits + idempotency. Void DRAFT only.                                                                                                       |
| **I7**   | `registerJournalRoutes()` (real)                                              | ✅ Done | 5 endpoints. `x-user-id` required for writes. `Idempotency-Key` for post/reverse.                                                                                                |
| **I8**   | `DrizzlePeriodRepo`, `closePeriod()`, `lockPeriod()`, `reopenPeriod()`        | ✅ Done | Period findById/findOpenByDate/close/reopen/lock/findAll. Full lifecycle: OPEN→CLOSED→LOCKED (permanent). CLOSED→OPEN via reopen.                                                |
| **I9**   | `DrizzleBalanceRepo`, `getTrialBalance()`                                     | ✅ Done | Trial balance aggregation. `upsertForJournal()` via INSERT ON CONFLICT DO UPDATE on composite PK.                                                                                |
| **I10**  | Account + period + balance routes                                             | ✅ Done | GET /accounts, GET /accounts/:id, GET /periods, GET /periods/:id, POST /periods/:id/close, POST /periods/:id/lock, POST /periods/:id/reopen, GET /trial-balance                  |
| **I11**  | `erp.fx_rate` DB table, `IFxRateRepo`, `ILedgerRepo`, multi-currency posting  | ✅ Done | FX rate lookup when journal line currency ≠ ledger base currency. `DrizzleFxRateRepo` resolves currency codes to IDs. `DrizzleLedgerRepo` joins currency table for baseCurrency. |
| **I12**  | `IIcAgreementRepo`, `IIcTransactionRepo`, `createIcTransaction()`, IC route   | ✅ Done | Paired journal creation (seller + buyer). IC document links both journals. POST /ic-transactions route.                                                                          |

---

## Validation Checklist

### Domain Invariants

1. ✅ `postJournal()` rejects unbalanced journals (bigint exact comparison)
2. ✅ `postJournal()` rejects journals with < 2 lines
3. ✅ `postJournal()` rejects non-DRAFT journals
4. ✅ `postJournal()` uses atomic `claimOrGet()` — no check-then-insert race
5. ✅ `postJournal()` rejects posting to CLOSED/LOCKED period (non-negotiable)
6. ✅ `postJournal()` validates `postingDate` falls within period date range
7. ✅ `reverseJournal()` creates mirror with swapped debits/credits
8. ✅ `voidJournal()` only works on DRAFT journals (POSTED must be reversed)
9. ✅ `closePeriod()` rejects period with unposted journals
10. ✅ `createJournal()` resolves `accountCode → accountId` before persisting
11. ✅ `lockPeriod()` only works on CLOSED periods (not OPEN or already LOCKED)
12. ✅ `reopenPeriod()` only works on CLOSED periods (LOCKED is permanent, OPEN
    is no-op)
13. ✅ Audit trail logged for full journal lifecycle: null→DRAFT, DRAFT→POSTED,
    POSTED→REVERSED, DRAFT→VOIDED
14. ✅ `postJournal()` enforces FX rate for foreign-currency lines (line
    currency ≠ ledger baseCurrency)
15. ✅ `createIcTransaction()` validates agreement is active, requires ≥1 source
    and ≥1 mirror line
16. ✅ `createIcTransaction()` creates paired journals and IC document
    atomically

### Infra Correctness

11. ✅ `DrizzleJournalRepo.findById()` loads journal + lines in single query
    (Drizzle `with`)
12. ✅ `DrizzleJournalRepo.save()` updates status only (immutability of posted
    lines)
13. ✅ All repositories receive `TenantTx` — never raw `DbClient`
14. ✅ Outbox write is in same transaction as state change
15. ✅ `DrizzleIdempotencyStore.claimOrGet()` uses
    `INSERT ... ON CONFLICT DO NOTHING` + SELECT
16. ✅ GL balance UPSERT happens in posting transaction via
    `balanceRepo.upsertForJournal()`
17. ✅ `FinanceRuntime` wires all deps; routes never import `@afenda/db`

### HTTP Layer

18. ✅ `POST /journals` validates body with `CreateJournalSchema`
19. ✅ `POST /journals/:id/post` requires `Idempotency-Key` + `x-user-id`
    headers
20. ✅ `POST /journals/:id/reverse` requires `Idempotency-Key` + `x-user-id`
    headers
21. ✅ `POST /journals/:id/void` requires `x-user-id` header
22. ✅ `GET /journals/:id` returns 404 for missing journal
23. ✅ All routes extract `x-tenant-id` from headers
24. ✅ All write routes require `x-user-id` (DB trigger
    `posted_by := erp.current_user_id()` fails without it)
25. ✅ `AppError` codes map to correct HTTP status codes
26. ✅ Routes receive `FinanceRuntime`, not `DbClient` — composition root
    handles wiring

### Multi-Tenant / Multi-Company

27. ✅ RLS enforced via `session.withTenant()` — no raw queries
28. ✅ Account codes are unique per tenant (not globally)
29. ✅ Ledger belongs to company; company belongs to tenant
30. ✅ Intercompany journals create paired entries across companies —
    `createIcTransaction()` service
31. ✅ FX conversion uses `convertAmount()` with bigint precision. `erp.fx_rate`
    table + `DrizzleFxRateRepo` for DB-level lookups.

### Governance

32. ✅ `pnpm --filter @afenda/finance typecheck` passes
33. ✅ `pnpm arch:guard` passes (244 checks, 0 failures, 0 warnings)
34. ✅ `pnpm agents:drift` passes (102 checks, 0 failures, 0 warnings)
35. ✅ No `drizzle-orm` imports in `domain/**` or `app/**`
36. ✅ No `fastify` imports outside `infra/routes/**`
37. ✅ No `@afenda/db` imports in `infra/routes/**` — dependency rule enforced

### Testing

38. ✅ Unit tests for domain invariants — 17 files, 121 unit tests (postJournal
    14, createJournal 5, reverseJournal 6, voidJournal 4, closePeriod 4,
    lockPeriod 4, reopenPeriod 4, createIcTransaction 5, idempotency 6,
    getJournal 2, getTrialBalance 2, processRecurringJournals 6,
    getBudgetVariance 3, getBalanceSheet 3, getIncomeStatement 3, routes 50)
39. ✅ HTTP tests for all 50 route endpoints — Fastify inject, mock runtime
    (routes.test.ts): journal 10, account 3, period 9, balance 2,
    ic-transactions 6, ic-agreements 4, ledgers 3, fx-rates 2,
    recurring-templates 4, budget 3, reports 4
40. ✅ Unit tests for idempotency (concurrent claimOrGet resolution — 6 tests
    including race condition)
41. ✅ Multi-currency posting tests (same-currency pass, foreign reject, foreign
    with rate pass, FX conversion verified, same-currency passthrough verified —
    5 tests in postJournal)
42. ✅ IC transaction tests (paired creation, agreement not found, inactive
    agreement, empty source/mirror lines — 5 tests)
43. ✅ Integration tests for Drizzle repos — 19 tests implemented (JournalRepo
    4, AccountRepo 3, PeriodRepo 5, IdempotencyStore 3, Multi-tenant isolation
    4). Skipped without `DATABASE_URL`.
44. ✅ Multi-tenant isolation tests — RLS prevents cross-tenant reads/writes (4
    tests in integration suite)
45. ✅ IC agreement route tests (paginated list, empty list, by-id 200, by-id
    404 — 4 tests)
46. ✅ Worker event handler registry tests (dispatch, unregistered warning,
    multiple types, overwrite, finance handlers — 5 tests in `apps/worker`)

### Cross-Cutting Integration

47. ✅ `apps/api` registers all 31 finance endpoints + error handler + BigInt
    serializer + health check (33 total HTTP endpoints)
48. ✅ `apps/api` never imports `drizzle-orm` directly — uses
    `createHealthCheck(db)` from `@afenda/db`
49. ✅ `apps/worker` drains `erp.outbox` via `createOutboxDrainer(db)` —
    `SELECT ... FOR UPDATE SKIP LOCKED` for safe concurrency
50. ✅ `apps/worker` dispatches events via `EventHandlerRegistry` — 7 finance
    event types registered with structured audit logging (JOURNAL_CREATED,
    JOURNAL_POSTED, GL_BALANCE_CHANGED, JOURNAL_REVERSED, JOURNAL_VOIDED,
    IC_TRANSACTION_CREATED, RECURRING_JOURNAL_CREATED)
51. ✅ `@afenda/db` exports `createOutboxDrainer`, `createHealthCheck`,
    `idempotencyStore` table

---

## Remaining Work

### P0 — Required Before Production ✅ ALL DONE

All P0 items are complete: 13 test files (95 unit + 19 integration), 39 HTTP
route tests, Fastify plugins, composition root wired. `apps/api` registers all
24 endpoints (22 finance + 2 health).

### P1 — Post-Launch Enhancements ✅ ALL DONE

All P1 items are complete: `erp.fx_rate` table, IC service, pagination, audit
trail, period locking, multi-currency posting.

### P2 — Future Enhancements (All Medium/Low DONE)

| Item                                            | Category | Description                                                                                                                                                                                                                                              | Priority   |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ~~IC route HTTP tests~~                         | Testing  | ✅ 6 tests: POST create/404/409/422, GET 200/404                                                                                                                                                                                                         | ~~High~~   |
| ~~IC GET route~~                                | Route    | ✅ `GET /ic-transactions/:id` — reads IC document by ID                                                                                                                                                                                                  | ~~Medium~~ |
| ~~FX rate lookup route~~                        | Route    | ✅ `GET /fx-rates?from=&to=&date=` — FX rate lookup with validation                                                                                                                                                                                      | ~~Medium~~ |
| ~~Ledger routes~~                               | Route    | ✅ `GET /ledgers`, `GET /ledgers/:id` — paginated list + by-ID lookup                                                                                                                                                                                    | ~~Medium~~ |
| ~~Multi-currency amount conversion in posting~~ | Feature  | ✅ `postJournal()` now applies FX rate via `convertAmount()` to compute base-currency GL balance equivalents. Foreign-currency lines converted, same-currency lines pass through. 2 new tests.                                                           | ~~Medium~~ |
| ~~IC agreement routes~~                         | Route    | ✅ `GET /ic-agreements`, `GET /ic-agreements/:id` — paginated list + by-ID. `IIcAgreementRepo.findAll()` added. 4 route tests.                                                                                                                           | ~~Low~~    |
| ~~DB migration for `erp.idempotency_store`~~    | Schema   | ✅ `erp.idempotency_store` Drizzle schema added to `@afenda/db`. `DrizzleIdempotencyStore` rewritten to use Drizzle query builder instead of raw SQL.                                                                                                    | ~~Low~~    |
| ~~`markupPercent` on IC agreement~~             | Schema   | ✅ `markup_percent` column added to `erp.ic_agreement` in Drizzle schema. Repo mapper reads from DB row.                                                                                                                                                 | ~~Low~~    |
| ~~Outbox worker drain~~                         | Infra    | ✅ `apps/worker` drains `erp.outbox` via polling loop (5s, batch 50). `createOutboxDrainer(db)` in `@afenda/db` uses `SELECT ... FOR UPDATE SKIP LOCKED`. `EventHandlerRegistry` dispatches by `eventType`. 5 finance handlers registered. 5 unit tests. | ~~Medium~~ |

### P3 — Completed

| Item                                           | Category | Status                                                                                                                                                                                                                                                                                            | Description                                                                                                                                                             |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Graphile Worker cron integration~~           | Infra    | ✅ `apps/worker` rewritten to use `graphile-worker` `run()` with cron task. `drain-outbox` runs every 10s via `parseCronItems`. Direct DB connection for LISTEN/NOTIFY.                                                                                                                           | ~~Done~~                                                                                                                                                                |
| ~~Recurring journals~~                         | Feature  | ✅ Domain entity `RecurringTemplate`, DB schema `erp.recurring_template`, port `IRecurringTemplateRepo`, `DrizzleRecurringTemplateRepo`, service `processRecurringJournals()`, 4 CRUD+process routes, 6 unit tests.                                                                               | ~~Done~~                                                                                                                                                                |
| ~~Budget vs. actual~~                          | Feature  | ✅ Domain entity `BudgetEntry`/`BudgetVarianceReport`, DB schema `erp.budget_entry` with unique constraint, port `IBudgetRepo`, `DrizzleBudgetRepo` with UPSERT, service `getBudgetVariance()`, 3 routes (POST upsert, GET list, GET variance).                                                   | ~~Done~~                                                                                                                                                                |
| ~~Financial reporting~~                        | Feature  | ✅ Domain entities `BalanceSheet`/`IncomeStatement`/`CashFlowStatement`, services `getBalanceSheet()` + `getIncomeStatement()`, 2 report routes (`GET /reports/balance-sheet`, `GET /reports/income-statement`). Account classification by code prefix.                                           | ~~Done~~                                                                                                                                                                |
| ~~Real event handler implementations~~         | Infra    | ✅ 7 structured handlers in `apps/worker/src/event-handlers.ts`: `JOURNAL_CREATED`, `JOURNAL_POSTED`, `GL_BALANCE_CHANGED`, `JOURNAL_REVERSED`, `JOURNAL_VOIDED`, `IC_TRANSACTION_CREATED`, `RECURRING_JOURNAL_CREATED`. All with event-specific payload extraction and structured audit logging. | ~~Done~~                                                                                                                                                                |
| **Drizzle migration for P2/P3 schema changes** | Schema   | ⏳ Pending                                                                                                                                                                                                                                                                                        | Generate `drizzle-kit` migration for: `erp.idempotency_store`, `erp.recurring_template`, `erp.budget_entry` tables. Currently in Drizzle schema but no migration files. |

---

## DB Schema Dependencies (from `@afenda/db`)

The finance module reads/writes these tables via Drizzle:

| Table                    | Used By                                      | Operations                                     |
| ------------------------ | -------------------------------------------- | ---------------------------------------------- |
| `erp.gl_journal`         | `DrizzleJournalRepo`                         | SELECT, INSERT, UPDATE (status only)           |
| `erp.gl_journal_line`    | `DrizzleJournalRepo`                         | SELECT, INSERT                                 |
| `erp.account`            | `DrizzleAccountRepo`                         | SELECT                                         |
| `erp.fiscal_period`      | `DrizzlePeriodRepo`                          | SELECT, UPDATE (status)                        |
| `erp.gl_balance`         | `DrizzleBalanceRepo`                         | SELECT, UPSERT                                 |
| `erp.outbox`             | `DrizzleOutboxWriter`                        | INSERT                                         |
| `erp.fx_rate`            | `DrizzleFxRateRepo`                          | SELECT (with currency join)                    |
| `erp.ledger`             | `DrizzleLedgerRepo`, join in journal queries | SELECT (with currency join for baseCurrency)   |
| `erp.currency`           | Join in ledger/fx-rate queries               | SELECT (for code resolution)                   |
| `erp.ic_agreement`       | `DrizzleIcAgreementRepo`                     | SELECT                                         |
| `erp.ic_transaction`     | `DrizzleIcTransactionRepo`                   | SELECT, INSERT                                 |
| `erp.ic_transaction_leg` | `DrizzleIcTransactionRepo`                   | SELECT, INSERT                                 |
| `erp.idempotency_store`  | `DrizzleIdempotencyStore`                    | SELECT, INSERT (ON CONFLICT DO NOTHING)        |
| `erp.recurring_template` | `DrizzleRecurringTemplateRepo`               | SELECT, INSERT, UPDATE (nextRunDate, isActive) |
| `erp.budget_entry`       | `DrizzleBudgetRepo`                          | SELECT, INSERT (ON CONFLICT DO UPDATE)         |

---

## Key Decisions

| Decision                                              | Rationale                                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repos receive `TenantTx`, not `DbClient`**          | Guarantees every query is inside a tenant-scoped transaction. No accidental cross-tenant reads.                                                                                  |
| **Mappers in separate `infra/mappers/` dir**          | Keeps repo files focused on queries. Mappers are reusable across repos.                                                                                                          |
| **`IIdempotencyStore` uses atomic `claimOrGet()`**    | `exists()` + `record()` races under concurrency. Single `INSERT ON CONFLICT DO NOTHING` + SELECT gives exactly-once semantics.                                                   |
| **`FinanceRuntime` injected into routes**             | Routes must not import `@afenda/db` (dependency rule). Composition root in `apps/api` creates the runtime, wires `session.withTenant()` + all repos. Routes stay framework-only. |
| **`x-user-id` required for all writes**               | DB trigger `posted_by := erp.current_user_id()` throws if missing. Reads allow fallback to `"system"`.                                                                           |
| **`JournalLine` carries `accountId` + `accountCode`** | API DTO uses `accountCode` (nice UX). `createJournal()` resolves to `accountId` via `IAccountRepo`. DB stores `accountId`. Domain exposes both for display + persistence.        |
| **GL balances computed in posting tx, not worker**    | `erp.gl_balance` UPSERT happens inside `postJournal()` / `reverseJournal()` transaction. `GL_BALANCE_CHANGED` outbox event is notification-only for cache invalidation.          |
| **Domain uses `Money` from `@afenda/core`**           | Bigint precision, currency-aware. DB stores raw bigint via `moneyBigint` custom type.                                                                                            |
| **Routes don't touch DB directly**                    | Routes → `FinanceRuntime` → services → repos → Drizzle. Three-layer indirection is intentional for testability.                                                                  |
| **Outbox in same transaction**                        | No side effects outside the transaction boundary. Worker drains outbox asynchronously.                                                                                           |
| **`erp.fx_rate` in DB**                               | `erp.fx_rate` table added to `@afenda/db`. `DrizzleFxRateRepo` resolves currency codes to IDs via join. `postJournal()` enforces FX rate lookup for foreign-currency lines.      |
| **Period-open-by-date is non-negotiable**             | Every journal `postingDate` must map to exactly one OPEN period. `createJournal()` and `postJournal()` both validate.                                                            |
| **Posting Engine = App + DB**                         | App orchestrates (idempotency, status, outbox). DB enforces (triggers, RLS, constraints). Neither alone is sufficient. See North Star statement.                                 |

# Finance Module Development Plan

> Bring `@afenda/finance` (S1) to full S2 feature parity using S1's superior
> architecture.
>
> **Principle**: One package (`@afenda/finance`), many domain slices — not 37
> packages. Each slice is a folder under `src/slices/` with its own calculators,
> ports, services, and routes. No ERP spaghetti. No cross-slice coupling. Every
> slice talks to GL via the existing posting spine.

---

## What S1 Already Has (41/280 benchmark items)

- Foundation Controls (7/7)
- Core GL + Double-Entry (12/12)
- Foreign Exchange (5/5)
- Intercompany (4/4)
- Accounting Hub (4/4)
- Recurring & Automated Entries (3/3)
- Financial Reporting (6/6)

**Existing infra**: 18 ports, 16 services, 14 calculators, 35 HTTP endpoints,
245+ tests, RLS, idempotency, audit trail, integer money.

---

## Architecture Rules (Non-Negotiable)

1. **Single package** — all slices live in `@afenda/finance`. No new workspace
   packages.
2. **Slice isolation** — each slice is a folder under `src/slices/<name>/` with
   co-located `entities/`, `calculators/`, `ports/`, `services/`, `repos/`,
   `routes/`. A slice may only import from `shared/` and its own folder. **No
   cross-slice imports** — enforced by arch-guard E16.
3. **GL spine is the only write path** — every slice that creates accounting
   entries calls `postJournal` (or emits an AccountingEvent for the hub). No
   direct GL writes.
4. **Ports before repos** — define the interface first (`I<Name>Repo`),
   implement Drizzle adapter second. Tests mock the port.
5. **Calculators are pure** — zero DB, zero side effects, 100% unit-testable. A
   calculator never calls a service or repo.
6. **Per-slice deps** — each slice defines its own `<Slice>Deps` interface.
   Services receive `SliceDeps & SharedDeps`, not a god-interface. `FinanceDeps`
   is composed via `extends` at the runtime level only.
7. **One migration per phase** — each phase adds its DB tables in a single
   numbered migration.
8. **Route registrar pattern** — each slice exports
   `register<Slice>Routes(app, deps)`, wired in `runtime.ts`.
9. **Cross-slice communication via hooks** — when slice A needs logic from slice
   B (e.g., AP needs tax calculation), it calls a hook port
   (`ITaxCalculationHook`), not a direct import. The runtime wires the hook.
10. **Shared types in `@afenda/contracts`** — Zod schemas for cross-slice DTOs
    (e.g., `InvoiceLineSchema`) live in the contracts package, not in any slice.

---

## Folder Convention (Target State)

Every slice is **self-contained**: entities, calculators, ports, services,
repos, routes, and tests co-located.

```
packages/modules/finance/src/
├── slices/
│   ├── gl/                        ← GL spine (journals, accounts, periods, balance)
│   │   ├── entities/              journal.ts, account.ts, fiscal-period.ts, gl-balance.ts, ledger.ts
│   │   ├── calculators/           journal-balance.ts, coa-hierarchy.ts, trial-balance.ts, segment-dimension.ts
│   │   ├── ports/                 journal-repo.ts, account-repo.ts, fiscal-period-repo.ts, gl-balance-repo.ts, ledger-repo.ts, journal-audit-repo.ts, period-audit-repo.ts, document-number-generator.ts
│   │   ├── services/              create-journal.ts, post-journal.ts, get-journal.ts, reverse-journal.ts, void-journal.ts, get-trial-balance.ts, close-period.ts, lock-period.ts, reopen-period.ts, close-year.ts, process-recurring-journals.ts
│   │   ├── repos/                 drizzle-journal-repo.ts, drizzle-account-repo.ts, drizzle-period-repo.ts, drizzle-balance-repo.ts, drizzle-journal-audit-repo.ts, drizzle-period-audit-repo.ts, drizzle-document-number-generator.ts, drizzle-ledger-repo.ts
│   │   ├── routes/                journal-routes.ts, account-routes.ts, period-routes.ts, balance-routes.ts, ledger-routes.ts
│   │   ├── __tests__/             (existing test files for GL)
│   │   └── index.ts               barrel: re-exports public types, ports, services
│   │
│   ├── fx/                        ← Foreign exchange
│   │   ├── entities/              fx-rate.ts, fx-rate-approval.ts
│   │   ├── calculators/           fx-convert.ts, fx-revaluation.ts, fx-translation.ts, fx-triangulation.ts
│   │   ├── ports/                 fx-rate-repo.ts, fx-rate-approval-repo.ts
│   │   ├── services/              (future: revalue-balances.ts)
│   │   ├── repos/                 drizzle-fx-rate-repo.ts, drizzle-fx-rate-approval-repo.ts
│   │   ├── routes/                fx-rate-routes.ts, fx-rate-approval-routes.ts
│   │   └── index.ts
│   │
│   ├── ic/                        ← Intercompany
│   │   ├── entities/              intercompany.ts, ic-settlement.ts
│   │   ├── calculators/           ic-elimination.ts, ic-aging.ts
│   │   ├── ports/                 ic-repo.ts, ic-settlement-repo.ts
│   │   ├── services/              create-ic-transaction.ts, settle-ic-documents.ts
│   │   ├── repos/                 drizzle-ic-repo.ts, drizzle-ic-settlement-repo.ts
│   │   ├── routes/                ic-routes.ts, ic-agreement-routes.ts, settlement-routes.ts
│   │   └── index.ts
│   │
│   ├── hub/                       ← Accounting Hub (derivation, allocation, accrual, rev-rec)
│   │   ├── entities/              classification-rule.ts, revenue-recognition.ts, budget.ts, recurring-template.ts
│   │   ├── calculators/           derivation-engine.ts, accrual-engine.ts, revenue-recognition.ts, deferred-revenue.ts, variance-alerts.ts
│   │   ├── ports/                 classification-rule-repo.ts, revenue-contract-repo.ts, budget-repo.ts, recurring-template-repo.ts
│   │   ├── services/              recognize-revenue.ts, get-budget-variance.ts, consolidate.ts
│   │   ├── repos/                 drizzle-classification-rule-repo.ts, drizzle-revenue-contract-repo.ts, drizzle-budget-repo.ts, drizzle-recurring-template-repo.ts
│   │   ├── routes/                classification-rule-routes.ts, revenue-routes.ts, budget-routes.ts, recurring-template-routes.ts, consolidation-routes.ts
│   │   └── index.ts
│   │
│   ├── reporting/                 ← Financial statements
│   │   ├── entities/              financial-reports.ts
│   │   ├── calculators/           report-classifier.ts, cash-flow-indirect.ts, comparative-report.ts, close-checklist.ts
│   │   ├── services/              get-balance-sheet.ts, get-income-statement.ts, get-cash-flow.ts, get-comparative-*.ts
│   │   ├── routes/                report-routes.ts
│   │   └── index.ts
│   │
│   ├── payables/                  ← Phase 1
│   ├── receivables/               ← Phase 1
│   ├── tax/                       ← Phase 2
│   ├── fixed-assets/              ← Phase 2
│   ├── bank-recon/                ← Phase 2
│   ├── credit/                    ← Phase 3
│   ├── expense/                   ← Phase 3
│   ├── project/                   ← Phase 3
│   ├── lease/                     ← Phase 4
│   ├── provisions/                ← Phase 4
│   ├── treasury/                  ← Phase 4
│   ├── cost-accounting/           ← Phase 5
│   ├── consolidation/             ← Phase 6
│   ├── statutory/                 ← Phase 6
│   ├── intangibles/               ← Phase 7
│   ├── fin-instruments/           ← Phase 7
│   ├── hedge/                     ← Phase 7
│   ├── deferred-tax/              ← Phase 7
│   └── transfer-pricing/          ← Phase 7
│
├── shared/                        ← Cross-cutting, used by ALL slices
│   ├── ports/                     idempotency-store.ts, outbox-writer.ts, authorization.ts
│   ├── repos/                     drizzle-idempotency.ts, drizzle-outbox-writer.ts
│   ├── routes/                    error-mapper.ts, fastify-plugins.ts, authorization-guard.ts, rate-limit-guard.ts
│   ├── mappers/                   (existing)
│   ├── events.ts                  FinanceEventType registry
│   └── currency-config.ts         precision registry
│
├── runtime.ts                     ← composition root (replaces infra/drizzle-finance-runtime.ts)
├── public.ts                      ← public API barrel
└── infra.ts                       ← infra API barrel
```

### Slice Anatomy (template for every new slice)

```
slices/<name>/
├── entities/        Domain types (branded IDs, value objects, enums)
├── calculators/     Pure functions — no DB, no side effects, no imports from other slices
├── ports/           Interface files (I<Name>Repo, I<Name>Store)
├── services/        Orchestration (deps + input → Result). May import from shared/ and own slice only.
├── repos/           Drizzle adapters implementing ports
├── routes/          Fastify route registrars
├── __tests__/       Co-located tests (*.test.ts)
└── index.ts         Barrel — re-exports only what other slices or public.ts need
```

---

## Phase 0 — Refactor Existing Code into Slices (MUST DO FIRST)

> **Goal**: Move the current 111 flat files into the slice structure above. Zero
> new features. Zero new tests. Only file moves + import rewrites. Every test
> must pass before and after. Typecheck must stay clean.

### Why This Is Non-Negotiable

The current structure has **5 flat folders** holding all concerns:

| Current Folder        | Files | Problem                              |
| --------------------- | ----- | ------------------------------------ |
| `domain/calculators/` | 19    | GL, FX, IC, Hub, Reporting all mixed |
| `domain/entities/`    | 15    | Same mix                             |
| `app/ports/`          | 20    | Same mix                             |
| `app/services/`       | 21    | Same mix                             |
| `infra/repositories/` | 18    | Same mix                             |
| `infra/routes/`       | 20    | Same mix                             |

Adding AP/AR (Phase 1) into these flat folders would push each to 25+ files with
no way to tell what belongs to what. By Phase 3 you'd have 40+ files per folder
— the exact ERP spaghetti we're avoiding.

### The `FinanceDeps` God-Interface Problem

Currently `FinanceDeps` is a single interface with **19 repos**. By Phase 3 it
would have 30+. This causes:

- Every service receives every repo (no compile-time scoping)
- Every test must mock 19 repos even if the service uses 2
- Adding a repo requires touching the god-interface, the runtime, and every test
  factory

**Fix**: Replace with **per-slice deps interfaces** composed at the runtime
level.

```ts
// slices/gl/ports/gl-deps.ts
export interface GlDeps {
  readonly journalRepo: IJournalRepo;
  readonly accountRepo: IAccountRepo;
  readonly periodRepo: IFiscalPeriodRepo;
  readonly balanceRepo: IGlBalanceRepo;
  readonly journalAuditRepo: IJournalAuditRepo;
  readonly periodAuditRepo: IPeriodAuditRepo;
  readonly ledgerRepo: ILedgerRepo;
  readonly documentNumberGenerator: IDocumentNumberGenerator;
}

// slices/fx/ports/fx-deps.ts
export interface FxDeps {
  readonly fxRateRepo: IFxRateRepo;
  readonly fxRateApprovalRepo: IFxRateApprovalRepo;
}

// slices/ic/ports/ic-deps.ts
export interface IcDeps {
  readonly icAgreementRepo: IIcAgreementRepo;
  readonly icTransactionRepo: IIcTransactionRepo;
  readonly icSettlementRepo: IIcSettlementRepo;
}

// shared/ports/shared-deps.ts
export interface SharedDeps {
  readonly idempotencyStore: IIdempotencyStore;
  readonly outboxWriter: IOutboxWriter;
}

// runtime.ts — composition root
export interface FinanceDeps
  extends GlDeps, FxDeps, IcDeps, HubDeps, SharedDeps {}
```

Services receive **only their slice's deps + shared deps**:

```ts
// slices/gl/services/post-journal.ts
export function postJournal(deps: GlDeps & SharedDeps, input: PostJournalInput): Promise<Result<...>> { ... }

// slices/ic/services/create-ic-transaction.ts
export function createIcTransaction(deps: IcDeps & GlDeps & SharedDeps, input: ...): Promise<Result<...>> { ... }
```

Tests mock only the deps they need:

```ts
// slices/gl/__tests__/post-journal.test.ts
const deps = makeGlDeps({ journalRepo: mockJournalRepo }); // only GL deps, not 19 repos
```

### File Move Map

Every existing file has exactly one target. No ambiguity.

#### → `slices/gl/`

| Current Path                                              | Target Path                                            |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `domain/entities/journal.ts`                              | `slices/gl/entities/journal.ts`                        |
| `domain/entities/account.ts`                              | `slices/gl/entities/account.ts`                        |
| `domain/entities/fiscal-period.ts`                        | `slices/gl/entities/fiscal-period.ts`                  |
| `domain/entities/gl-balance.ts`                           | `slices/gl/entities/gl-balance.ts`                     |
| `domain/entities/ledger.ts`                               | `slices/gl/entities/ledger.ts`                         |
| `domain/entities/journal-audit.ts`                        | `slices/gl/entities/journal-audit.ts`                  |
| `domain/calculators/journal-balance.ts`                   | `slices/gl/calculators/journal-balance.ts`             |
| `domain/calculators/coa-hierarchy.ts`                     | `slices/gl/calculators/coa-hierarchy.ts`               |
| `domain/calculators/trial-balance.ts`                     | `slices/gl/calculators/trial-balance.ts`               |
| `domain/calculators/segment-dimension.ts`                 | `slices/gl/calculators/segment-dimension.ts`           |
| `app/ports/journal-repo.ts`                               | `slices/gl/ports/journal-repo.ts`                      |
| `app/ports/account-repo.ts`                               | `slices/gl/ports/account-repo.ts`                      |
| `app/ports/fiscal-period-repo.ts`                         | `slices/gl/ports/fiscal-period-repo.ts`                |
| `app/ports/gl-balance-repo.ts`                            | `slices/gl/ports/gl-balance-repo.ts`                   |
| `app/ports/ledger-repo.ts`                                | `slices/gl/ports/ledger-repo.ts`                       |
| `app/ports/journal-audit-repo.ts`                         | `slices/gl/ports/journal-audit-repo.ts`                |
| `app/ports/period-audit-repo.ts`                          | `slices/gl/ports/period-audit-repo.ts`                 |
| `app/ports/document-number-generator.ts`                  | `slices/gl/ports/document-number-generator.ts`         |
| `app/services/create-journal.ts`                          | `slices/gl/services/create-journal.ts`                 |
| `app/services/post-journal.ts`                            | `slices/gl/services/post-journal.ts`                   |
| `app/services/get-journal.ts`                             | `slices/gl/services/get-journal.ts`                    |
| `app/services/reverse-journal.ts`                         | `slices/gl/services/reverse-journal.ts`                |
| `app/services/void-journal.ts`                            | `slices/gl/services/void-journal.ts`                   |
| `app/services/get-trial-balance.ts`                       | `slices/gl/services/get-trial-balance.ts`              |
| `app/services/close-period.ts`                            | `slices/gl/services/close-period.ts`                   |
| `app/services/lock-period.ts`                             | `slices/gl/services/lock-period.ts`                    |
| `app/services/reopen-period.ts`                           | `slices/gl/services/reopen-period.ts`                  |
| `app/services/close-year.ts`                              | `slices/gl/services/close-year.ts`                     |
| `app/services/process-recurring-journals.ts`              | `slices/gl/services/process-recurring-journals.ts`     |
| `infra/repositories/drizzle-journal-repo.ts`              | `slices/gl/repos/drizzle-journal-repo.ts`              |
| `infra/repositories/drizzle-account-repo.ts`              | `slices/gl/repos/drizzle-account-repo.ts`              |
| `infra/repositories/drizzle-period-repo.ts`               | `slices/gl/repos/drizzle-period-repo.ts`               |
| `infra/repositories/drizzle-balance-repo.ts`              | `slices/gl/repos/drizzle-balance-repo.ts`              |
| `infra/repositories/drizzle-journal-audit-repo.ts`        | `slices/gl/repos/drizzle-journal-audit-repo.ts`        |
| `infra/repositories/drizzle-period-audit-repo.ts`         | `slices/gl/repos/drizzle-period-audit-repo.ts`         |
| `infra/repositories/drizzle-document-number-generator.ts` | `slices/gl/repos/drizzle-document-number-generator.ts` |
| `infra/repositories/drizzle-ledger-repo.ts`               | `slices/gl/repos/drizzle-ledger-repo.ts`               |
| `infra/routes/journal-routes.ts`                          | `slices/gl/routes/journal-routes.ts`                   |
| `infra/routes/account-routes.ts`                          | `slices/gl/routes/account-routes.ts`                   |
| `infra/routes/period-routes.ts`                           | `slices/gl/routes/period-routes.ts`                    |
| `infra/routes/balance-routes.ts`                          | `slices/gl/routes/balance-routes.ts`                   |
| `infra/routes/ledger-routes.ts`                           | `slices/gl/routes/ledger-routes.ts`                    |

#### → `slices/fx/`

| Current Path                                          | Target Path                                        |
| ----------------------------------------------------- | -------------------------------------------------- |
| `domain/entities/fx-rate.ts`                          | `slices/fx/entities/fx-rate.ts`                    |
| `domain/entities/fx-rate-approval.ts`                 | `slices/fx/entities/fx-rate-approval.ts`           |
| `domain/calculators/fx-convert.ts`                    | `slices/fx/calculators/fx-convert.ts`              |
| `domain/calculators/fx-revaluation.ts`                | `slices/fx/calculators/fx-revaluation.ts`          |
| `domain/calculators/fx-translation.ts`                | `slices/fx/calculators/fx-translation.ts`          |
| `domain/calculators/fx-triangulation.ts`              | `slices/fx/calculators/fx-triangulation.ts`        |
| `app/ports/fx-rate-repo.ts`                           | `slices/fx/ports/fx-rate-repo.ts`                  |
| `app/ports/fx-rate-approval-repo.ts`                  | `slices/fx/ports/fx-rate-approval-repo.ts`         |
| `infra/repositories/drizzle-fx-rate-repo.ts`          | `slices/fx/repos/drizzle-fx-rate-repo.ts`          |
| `infra/repositories/drizzle-fx-rate-approval-repo.ts` | `slices/fx/repos/drizzle-fx-rate-approval-repo.ts` |
| `infra/routes/fx-rate-routes.ts`                      | `slices/fx/routes/fx-rate-routes.ts`               |
| `infra/routes/fx-rate-approval-routes.ts`             | `slices/fx/routes/fx-rate-approval-routes.ts`      |

#### → `slices/ic/`

| Current Path                                       | Target Path                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| `domain/entities/intercompany.ts`                  | `slices/ic/entities/intercompany.ts`            |
| `domain/entities/ic-settlement.ts`                 | `slices/ic/entities/ic-settlement.ts`           |
| `domain/calculators/ic-elimination.ts`             | `slices/ic/calculators/ic-elimination.ts`       |
| `domain/calculators/ic-aging.ts`                   | `slices/ic/calculators/ic-aging.ts`             |
| `app/ports/ic-repo.ts`                             | `slices/ic/ports/ic-repo.ts`                    |
| `app/ports/ic-settlement-repo.ts`                  | `slices/ic/ports/ic-settlement-repo.ts`         |
| `app/services/create-ic-transaction.ts`            | `slices/ic/services/create-ic-transaction.ts`   |
| `app/services/settle-ic-documents.ts`              | `slices/ic/services/settle-ic-documents.ts`     |
| `infra/repositories/drizzle-ic-repo.ts`            | `slices/ic/repos/drizzle-ic-repo.ts`            |
| `infra/repositories/drizzle-ic-settlement-repo.ts` | `slices/ic/repos/drizzle-ic-settlement-repo.ts` |
| `infra/routes/ic-routes.ts`                        | `slices/ic/routes/ic-routes.ts`                 |
| `infra/routes/ic-agreement-routes.ts`              | `slices/ic/routes/ic-agreement-routes.ts`       |
| `infra/routes/settlement-routes.ts`                | `slices/ic/routes/settlement-routes.ts`         |

#### → `slices/hub/`

| Current Path                                             | Target Path                                            |
| -------------------------------------------------------- | ------------------------------------------------------ |
| `domain/entities/classification-rule.ts`                 | `slices/hub/entities/classification-rule.ts`           |
| `domain/entities/revenue-recognition.ts`                 | `slices/hub/entities/revenue-recognition.ts`           |
| `domain/entities/budget.ts`                              | `slices/hub/entities/budget.ts`                        |
| `domain/entities/recurring-template.ts`                  | `slices/hub/entities/recurring-template.ts`            |
| `domain/calculators/derivation-engine.ts`                | `slices/hub/calculators/derivation-engine.ts`          |
| `domain/calculators/accrual-engine.ts`                   | `slices/hub/calculators/accrual-engine.ts`             |
| `domain/calculators/revenue-recognition.ts`              | `slices/hub/calculators/revenue-recognition.ts`        |
| `domain/calculators/deferred-revenue.ts`                 | `slices/hub/calculators/deferred-revenue.ts`           |
| `domain/calculators/variance-alerts.ts`                  | `slices/hub/calculators/variance-alerts.ts`            |
| `app/ports/classification-rule-repo.ts`                  | `slices/hub/ports/classification-rule-repo.ts`         |
| `app/ports/revenue-contract-repo.ts`                     | `slices/hub/ports/revenue-contract-repo.ts`            |
| `app/ports/budget-repo.ts`                               | `slices/hub/ports/budget-repo.ts`                      |
| `app/ports/recurring-template-repo.ts`                   | `slices/hub/ports/recurring-template-repo.ts`          |
| `app/services/recognize-revenue.ts`                      | `slices/hub/services/recognize-revenue.ts`             |
| `app/services/get-budget-variance.ts`                    | `slices/hub/services/get-budget-variance.ts`           |
| `app/services/consolidate.ts`                            | `slices/hub/services/consolidate.ts`                   |
| `infra/repositories/drizzle-classification-rule-repo.ts` | `slices/hub/repos/drizzle-classification-rule-repo.ts` |
| `infra/repositories/drizzle-revenue-contract-repo.ts`    | `slices/hub/repos/drizzle-revenue-contract-repo.ts`    |
| `infra/repositories/drizzle-budget-repo.ts`              | `slices/hub/repos/drizzle-budget-repo.ts`              |
| `infra/repositories/drizzle-recurring-template-repo.ts`  | `slices/hub/repos/drizzle-recurring-template-repo.ts`  |
| `infra/routes/classification-rule-routes.ts`             | `slices/hub/routes/classification-rule-routes.ts`      |
| `infra/routes/revenue-routes.ts`                         | `slices/hub/routes/revenue-routes.ts`                  |
| `infra/routes/budget-routes.ts`                          | `slices/hub/routes/budget-routes.ts`                   |
| `infra/routes/recurring-template-routes.ts`              | `slices/hub/routes/recurring-template-routes.ts`       |
| `infra/routes/consolidation-routes.ts`                   | `slices/hub/routes/consolidation-routes.ts`            |

#### → `slices/reporting/`

| Current Path                                       | Target Path                                                     |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `domain/entities/financial-reports.ts`             | `slices/reporting/entities/financial-reports.ts`                |
| `domain/calculators/report-classifier.ts`          | `slices/reporting/calculators/report-classifier.ts`             |
| `domain/calculators/cash-flow-indirect.ts`         | `slices/reporting/calculators/cash-flow-indirect.ts`            |
| `domain/calculators/comparative-report.ts`         | `slices/reporting/calculators/comparative-report.ts`            |
| `domain/calculators/close-checklist.ts`            | `slices/reporting/calculators/close-checklist.ts`               |
| `app/services/get-balance-sheet.ts`                | `slices/reporting/services/get-balance-sheet.ts`                |
| `app/services/get-income-statement.ts`             | `slices/reporting/services/get-income-statement.ts`             |
| `app/services/get-cash-flow.ts`                    | `slices/reporting/services/get-cash-flow.ts`                    |
| `app/services/get-comparative-balance-sheet.ts`    | `slices/reporting/services/get-comparative-balance-sheet.ts`    |
| `app/services/get-comparative-income-statement.ts` | `slices/reporting/services/get-comparative-income-statement.ts` |
| `infra/routes/report-routes.ts`                    | `slices/reporting/routes/report-routes.ts`                      |

#### → `shared/`

| Current Path                                          | Target Path                                            |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `app/ports/idempotency-store.ts`                      | `shared/ports/idempotency-store.ts`                    |
| `app/ports/outbox-writer.ts`                          | `shared/ports/outbox-writer.ts`                        |
| `app/ports/authorization.ts`                          | `shared/ports/authorization.ts`                        |
| `app/ports/finance-runtime.ts`                        | `shared/ports/finance-deps.ts` (rewritten — see above) |
| `infra/repositories/drizzle-idempotency.ts`           | `shared/repos/drizzle-idempotency.ts`                  |
| `infra/repositories/drizzle-outbox-writer.ts`         | `shared/repos/drizzle-outbox-writer.ts`                |
| `infra/routes/error-mapper.ts`                        | `shared/routes/error-mapper.ts`                        |
| `infra/routes/fastify-plugins.ts`                     | `shared/routes/fastify-plugins.ts`                     |
| `infra/routes/authorization-guard.ts`                 | `shared/routes/authorization-guard.ts`                 |
| `infra/routes/rate-limit-guard.ts`                    | `shared/routes/rate-limit-guard.ts`                    |
| `infra/authorization/default-authorization-policy.ts` | `shared/authorization/default-authorization-policy.ts` |
| `infra/mappers/*`                                     | `shared/mappers/*`                                     |
| `domain/events.ts`                                    | `shared/events.ts`                                     |

### Phase 0 Execution Steps

1. **Create slice directories** — `slices/gl/`, `slices/fx/`, `slices/ic/`,
   `slices/hub/`, `slices/reporting/`, `shared/`
2. **Move files** — follow the file move map above (git mv for clean history)
3. **Rewrite imports** — update all `import` paths. Use IDE refactor or `sed`
   for bulk rewrite.
4. **Create slice barrel files** — each `slices/<name>/index.ts` re-exports
   public types
5. **Split `FinanceDeps`** — create `GlDeps`, `FxDeps`, `IcDeps`, `HubDeps`,
   `ReportingDeps`, `SharedDeps` per-slice deps interfaces. `FinanceDeps`
   becomes `extends GlDeps & FxDeps & IcDeps & HubDeps & SharedDeps`.
6. **Update `public.ts`** — re-export from `slices/*/index.ts` instead of flat
   paths
7. **Update `infra.ts`** — re-export repos and routes from `slices/*/repos/` and
   `slices/*/routes/`
8. **Update `runtime.ts`** — compose per-slice deps into `FinanceDeps`
9. **Run typecheck** — `pnpm typecheck` must pass
10. **Run tests** — `pnpm test` must pass with zero changes to test logic
11. **Run arch-guard** — add **E16** rule:
    `no import from slices/<other-slice>/` (only `shared/` and own slice
    allowed)
12. **Delete empty old folders** — `app/`, `domain/`, `infra/` (now empty after
    moves)

### Phase 0 Verification Checklist

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm test` — all 245+ tests pass, zero test file changes
- [ ] `pnpm lint` — clean
- [ ] `pnpm arch:guard` — E16 passes (no cross-slice imports)
- [ ] `git diff --stat` — only renames + import rewrites, no logic changes
- [ ] `public.ts` exports unchanged (same symbols, different paths)
- [ ] `infra.ts` exports unchanged (same symbols, different paths)
- [ ] `apps/api` and `apps/worker` compile without changes (they import from
      barrel only)

### Estimated Effort

1 session. Pure mechanical refactor. No feature changes, no test changes.

---

## Phase 1 — Sub-Ledgers: AP & AR

**Why first**: Every business needs invoices and payments. Highest daily
transaction volume. Unlocks 20 benchmark items.

### 1a. Accounts Payable (AP-01 → AP-10)

| Item  | What to Build                                                | Type                          |
| ----- | ------------------------------------------------------------ | ----------------------------- |
| AP-01 | 3-way match engine (PO ref → receipt ref → invoice)          | calculator                    |
| AP-02 | Supplier aging report (current/30/60/90/90+)                 | calculator + service          |
| AP-03 | Payment run (batch by due date, currency, supplier)          | service                       |
| AP-04 | Early payment discount (2/10 net 30 terms)                   | calculator                    |
| AP-05 | Supplier statement reconciliation                            | service                       |
| AP-06 | ISO 20022 pain.001 payment file generation                   | calculator (pure XML builder) |
| AP-07 | WHT at payment (link to tax slice later)                     | calculator hook               |
| AP-08 | Debit memo / credit note (negative invoice)                  | service (reuses postJournal)  |
| AP-09 | Duplicate invoice detection (supplier + ref + amount + date) | calculator                    |
| AP-10 | Accrued liabilities (uninvoiced receipts)                    | calculator + service          |

**DB tables**: `erp.ap_invoice`, `erp.ap_invoice_line`, `erp.ap_payment_run`,
`erp.ap_payment_run_item`, `erp.payment_terms_template`,
`erp.payment_terms_line`

**Ports**: `IApInvoiceRepo`, `IApPaymentRunRepo`, `IPaymentTermsRepo`

**Routes**: `POST /ap-invoices`, `GET /ap-invoices`, `GET /ap-invoices/:id`,
`POST /ap-invoices/:id/post`, `POST /ap-payment-runs`,
`POST /ap-payment-runs/:id/execute`, `GET /reports/ap-aging`

**Tests**: ~40 unit (calculators + services), ~10 route tests

### 1b. Accounts Receivable (AR-01 → AR-10)

| Item  | What to Build                                 | Type                          |
| ----- | --------------------------------------------- | ----------------------------- |
| AR-01 | Customer invoice with line-level tax          | service (reuses postJournal)  |
| AR-02 | Payment allocation (FIFO or specific)         | calculator                    |
| AR-03 | Customer aging report                         | calculator + service          |
| AR-04 | ECL provisioning (IFRS 9 simplified approach) | calculator                    |
| AR-05 | Write-off workflow with approval              | service + authorization guard |
| AR-06 | Dunning (escalating letter generation)        | calculator + service          |
| AR-07 | Credit note / return (negative invoice)       | service                       |
| AR-08 | IC receivable matching (link to IC slice)     | calculator hook               |
| AR-09 | Invoice discounting / factoring               | service                       |
| AR-10 | Revenue recognition integration (link to hub) | service hook                  |

**DB tables**: `erp.ar_invoice`, `erp.ar_invoice_line`,
`erp.ar_payment_allocation`, `erp.dunning_run`, `erp.dunning_letter`

**Ports**: `IArInvoiceRepo`, `IArPaymentAllocationRepo`, `IDunningRepo`

**Routes**: `POST /ar-invoices`, `GET /ar-invoices`, `GET /ar-invoices/:id`,
`POST /ar-invoices/:id/post`, `POST /ar-invoices/:id/allocate-payment`,
`POST /ar-invoices/:id/write-off`, `POST /dunning-runs`, `GET /reports/ar-aging`

**Tests**: ~40 unit, ~10 route tests

**Migration**: `0007_ap_ar_tables.sql`

**Estimated effort**: 2–3 sessions

---

## Phase 2 — Tax, Fixed Assets, Bank Reconciliation

**Why second**: Tax touches every invoice (AP/AR dependency). Fixed assets are
high-value, low-frequency. Bank recon is daily ops.

### 2a. Tax Engine (TX-01 → TX-10)

| Item  | What to Build                               | Type                               |
| ----- | ------------------------------------------- | ---------------------------------- |
| TX-01 | Multi-jurisdiction rate tables              | port + repo                        |
| TX-02 | Tax code hierarchy (country → state → city) | calculator (tree lookup)           |
| TX-03 | Input vs output tax netting (VAT/GST)       | calculator                         |
| TX-04 | Tax return aggregation by period            | service + report                   |
| TX-05 | SAF-T export                                | calculator (pure XML/JSON builder) |
| TX-06 | WHT per payee + treaty rates                | calculator (extends AP-07)         |
| TX-07 | Deferred tax temporary differences          | calculator (IAS 12)                |
| TX-08 | Tax provision calculation                   | service                            |
| TX-09 | Country-specific formats (MY SST, SG GST)   | calculator (pluggable formatters)  |
| TX-10 | Transfer pricing arm's-length validation    | calculator hook (link to TP slice) |

**DB tables**: `erp.tax_rate`, `erp.tax_code`, `erp.tax_return_period`,
`erp.wht_certificate`

**Ports**: `ITaxRateRepo`, `ITaxCodeRepo`, `ITaxReturnRepo`,
`IWhtCertificateRepo`

### 2b. Fixed Assets (FA-01 → FA-10)

| Item  | What to Build                          | Type                                     |
| ----- | -------------------------------------- | ---------------------------------------- |
| FA-01 | Asset register (cost, accum depr, NBV) | port + repo                              |
| FA-02 | Depreciation methods (SL, DB, UoP)     | calculator (pure, strategy pattern)      |
| FA-03 | Useful life + residual value review    | service                                  |
| FA-04 | Component accounting                   | calculator (split asset into components) |
| FA-05 | Revaluation model (fair value → OCI)   | calculator + service                     |
| FA-06 | Impairment testing (IAS 36)            | calculator                               |
| FA-07 | Disposal (gain/loss = proceeds − NBV)  | calculator + service (posts journal)     |
| FA-08 | Bulk depreciation run                  | service (batch, idempotent per period)   |
| FA-09 | Asset transfer between companies       | service (IC journal pair)                |
| FA-10 | CWIP → asset capitalization            | service                                  |

**DB tables**: `erp.asset`, `erp.asset_component`, `erp.depreciation_schedule`,
`erp.asset_movement`

**Ports**: `IAssetRepo`, `IDepreciationScheduleRepo`, `IAssetMovementRepo`

### 2c. Bank Reconciliation (BR-01 → BR-10)

| Item  | What to Build                                | Type                           |
| ----- | -------------------------------------------- | ------------------------------ |
| BR-01 | Bank statement import (OFX, MT940, camt.053) | calculator (parser, pure)      |
| BR-02 | Auto-matching (amount + date + reference)    | calculator (scoring algorithm) |
| BR-03 | Manual match for complex transactions        | service                        |
| BR-04 | Auto-post confirmed matches to GL            | service (posts journal)        |
| BR-05 | Unmatched item investigation workflow        | service + status machine       |
| BR-06 | Outstanding checks / deposits-in-transit     | calculator                     |
| BR-07 | Bank charges auto-recognition                | calculator (rule-based)        |
| BR-08 | Multi-currency reconciliation                | calculator (extends FX)        |
| BR-09 | Reconciliation sign-off with evidence        | service + audit trail          |
| BR-10 | Intraday balance monitoring                  | calculator + service           |

**DB tables**: `erp.bank_statement`, `erp.bank_statement_line`,
`erp.bank_match`, `erp.bank_reconciliation`

**Ports**: `IBankStatementRepo`, `IBankMatchRepo`, `IBankReconciliationRepo`

**Migration**: `0008_tax_assets_bank.sql`

**Estimated effort**: 3–4 sessions

---

## Phase 3 — Credit, Expense, Project Accounting

### 3a. Credit Management (CM-01 → CM-10)

- Credit limit per customer (port + calculator)
- Credit exposure (outstanding + open orders) calculator
- Credit hold / release workflow (service + SoD guard)
- Dunning escalation (extends AR dunning)
- Bad debt write-off (service, posts journal)
- ECL integration (calculator, links to AR-04)

**DB tables**: `erp.credit_limit`, `erp.credit_review`

### 3b. Expense Management (EM-01 → EM-10)

- Expense claim submission (service + approval workflow)
- Per-diem / mileage rate tables (port + calculator)
- Policy enforcement (calculator, category limits)
- Reimbursement via AP run (service, links to AP-03)
- Foreign currency reimbursement (calculator, links to FX)

**DB tables**: `erp.expense_claim`, `erp.expense_claim_line`,
`erp.expense_policy`

### 3c. Project Accounting (PA-01 → PA-10)

- Project master (budget, dates, billing type) — port + repo
- Cost posting to project dimension (extends GL segment-dimension)
- Earned value management (EV, PV, AC) — calculator (pure)
- Percentage-of-completion revenue (calculator, links to hub)
- WIP-to-revenue transfer journal (service, posts journal)
- Project billing (milestone, T&M, fixed-fee) — service
- Project profitability report — calculator + service

**DB tables**: `erp.project`, `erp.project_cost_line`, `erp.project_billing`

**Migration**: `0009_credit_expense_project.sql`

**Estimated effort**: 2–3 sessions

---

## Phase 4 — Lease, Provisions, Treasury

### 4a. Lease Accounting — IFRS 16 (LA-01 → LA-10)

- ROU asset + lease liability recognition (calculator, PV of payments)
- Amortization schedule (interest + principal split) — calculator
- Lease modification (remeasurement) — calculator + service
- Short-term / low-value exemptions — calculator (flag-based)
- Sale-and-leaseback — calculator
- Lessor accounting (finance vs operating) — calculator

**DB tables**: `erp.lease_contract`, `erp.lease_schedule`,
`erp.lease_modification`

### 4b. Provisions — IAS 37 (PR-01 → PR-10)

- Recognition criteria check (calculator, boolean)
- Best estimate + discount unwind (calculator, time-value)
- Utilisation / reversal tracking (service, posts journal)
- Onerous contract / restructuring provision types
- Contingent liability disclosure flag

**DB tables**: `erp.provision`, `erp.provision_movement`

### 4c. Treasury & Cash (TR-01 → TR-10)

- Cash flow forecast (calculator, extends cash-flow-indirect)
- Cash pooling / notional pooling (calculator)
- Bank statement import (shared with bank-recon)
- Covenant monitoring (calculator + alerts)
- FX exposure reporting (calculator, extends FX slice)
- IC loan management (service, links to IC)

**DB tables**: `erp.cash_forecast`, `erp.covenant`, `erp.ic_loan`

**Migration**: `0010_lease_provisions_treasury.sql`

**Estimated effort**: 3–4 sessions

---

## Phase 5 — Cost Accounting, Budgeting+, Subscription+

### 5a. Cost Accounting (CA-01 → CA-10)

- Cost center hierarchy (reuse existing `coa-hierarchy.ts`)
- Allocation methods (direct, step-down, reciprocal) — calculator
- Activity-based costing — calculator
- Standard costing variance analysis — calculator
- Overhead absorption rate — calculator
- Profitability analysis by product/customer — calculator + report

**DB tables**: `erp.cost_driver`, `erp.cost_allocation_run`

### 5b. Budgeting Extensions (BU-01 → BU-10)

S1 already has `IBudgetRepo`, `getBudgetVariance`, `variance-alerts.ts`. Extend
with:

- Budget versions (original/revised/latest) — add `version` column
- Budget consolidation across companies — calculator
- Rolling forecast vs static — calculator
- Budget commitment on PO (encumbrance) — service hook
- Scenario planning (base/upside/downside) — calculator
- Budget import from spreadsheet — calculator (CSV/XLSX parser)

### 5c. Subscription Billing Extensions (SB-01 → SB-10)

S1 already has `IRecurringTemplateRepo`, `processRecurringJournals`,
`revenue-recognition.ts`. Extend with:

- Upgrade / downgrade proration — calculator
- Usage-based billing metering — port + service
- Churn tracking / MRR/ARR reporting — calculator
- Payment gateway integration — port (abstract, no vendor lock-in)

**Migration**: `0011_cost_budget_subscription.sql`

**Estimated effort**: 2–3 sessions

---

## Phase 6 — Consolidation+, Statutory Reporting+

### 6a. Consolidation Extensions (CO-01 → CO-10)

S1 already has `ic-elimination.ts`, `fx-translation.ts`,
`consolidation-routes.ts`. Extend with:

- Group ownership hierarchy — port + calculator
- Non-controlling interest (NCI) — calculator
- Goodwill on acquisition (IFRS 3) — calculator
- Ownership % change over time — service
- Dividend elimination — calculator
- Consolidation journal auto-generation — service (batch)

**DB tables**: `erp.group_entity`, `erp.ownership_record`, `erp.goodwill`

### 6b. Statutory Reporting Extensions (SR-01 → SR-10)

S1 already has balance sheet, income statement, cash flow, comparative reports.
Extend with:

- Statement of changes in equity — calculator + service
- Notes to financial statements — template engine (pure)
- Segment reporting (IFRS 8) — calculator (extends dimensions)
- Related party disclosures (IAS 24) — calculator (links to IC)
- XBRL tagging — calculator (pure XML builder)

### 6c. Subledger Architecture (SLA-01 → SLA-10)

Formalize the existing accounting hub into a full SLA:

- AccountingEvent type + event store table
- Mapping rules (event → journal template) — extend derivation-engine
- Multi-ledger derivation (1 event → N journals)
- Preview mode (derive without posting)
- Mapping version lifecycle (draft → published → deprecated)

**DB tables**: `erp.accounting_event`, `erp.mapping_rule`,
`erp.mapping_rule_version`

**Migration**: `0012_consolidation_statutory_sla.sql`

**Estimated effort**: 3–4 sessions

---

## Phase 7 — IFRS Specialist Modules

These are lower-frequency, higher-complexity standards. Most are pure
calculators with thin DB persistence.

### 7a. Intangible Assets — IAS 38 (IA-01 → IA-10)

- Recognition criteria check, R&D phase gate
- Amortization (finite vs indefinite life) — calculator (reuse depreciation
  strategy)
- Impairment test for indefinite-life — calculator (reuse FA-06)
- Software capitalization rules

**DB tables**: `erp.intangible_asset` (mirrors `erp.asset` structure)

### 7b. Financial Instruments — IFRS 9 (FI-01 → FI-10)

- Classification engine (AC / FVOCI / FVTPL) — calculator (business model + SPPI
  test)
- Effective interest rate (EIR) method — calculator
- Fair value hierarchy (Level 1/2/3) — calculator
- ECL model (12-month vs lifetime) — calculator (extends AR-04)
- Derecognition (transfer of risks) — calculator

**DB tables**: `erp.financial_instrument`, `erp.fair_value_measurement`

### 7c. Hedge Accounting — IFRS 9 §6 (HA-01 → HA-10)

- Hedge designation (instrument + item + type) — service
- Effectiveness testing (dollar-offset, regression) — calculator
- OCI reserve tracking — calculator + service
- Discontinuation / rebalancing — service

**DB tables**: `erp.hedge_relationship`, `erp.hedge_effectiveness_test`

### 7d. Deferred Tax — IAS 12 (extends TX-07/TX-08)

- Temporary difference identification — calculator
- Deferred tax asset/liability computation — calculator
- Tax rate change impact — calculator
- Deferred tax movement schedule — calculator + report

**DB tables**: `erp.deferred_tax_item`

### 7e. Transfer Pricing — OECD (TP-01 → TP-10)

- TP methods (CUP, resale price, cost-plus, TNMM) — calculator
- Price validation at transaction time — service hook (extends IC)
- TP documentation (master file + local file) — template engine
- CbCR report — calculator + report
- Thin capitalization limits — calculator

**DB tables**: `erp.tp_policy`, `erp.tp_benchmark`

**Migration**: `0013_ifrs_specialist.sql`

**Estimated effort**: 4–5 sessions

---

## Phase 8 — Internal Controls & Data Architecture Hardening

### 8a. Internal Controls (IC-05, IC-08, IC-09)

S1 already has SoD, authorization, audit trail, period lock, idempotency,
four-eyes. Add:

- Reconciliation controls (sub-ledger = GL) — calculator + scheduled job
- Exception reporting — service (anomaly detection on GL)
- User access review (quarterly) — report + service

### 8b. Data Architecture (DA-03, DA-09)

S1 already has integer money, RLS, soft delete, effective dating, idempotency,
audit log, read replicas. Add:

- Optimistic concurrency (`expectedVersion` on high-contention entities)
- Table partitioning strategy for `gl_journal_line`, `gl_balance` (range by
  period)

**No new migration** — these are ALTER statements on existing tables.

**Estimated effort**: 1–2 sessions

---

## Total Estimate

| Phase | Scope                                        | New Benchmark Items | Sessions   |
| ----- | -------------------------------------------- | ------------------- | ---------- |
| **0** | **Refactor into slices + split FinanceDeps** | **0 (structural)**  | **1**      |
| 1     | AP + AR                                      | 20                  | 2–3        |
| 2     | Tax + Fixed Assets + Bank Recon              | 30                  | 3–4        |
| 3     | Credit + Expense + Project                   | 30                  | 2–3        |
| 4     | Lease + Provisions + Treasury                | 30                  | 3–4        |
| 5     | Cost Accounting + Budget+ + Subscription+    | 24                  | 2–3        |
| 6     | Consolidation+ + Statutory+ + SLA            | 26                  | 3–4        |
| 7     | IFRS Specialist (5 modules)                  | 50                  | 4–5        |
| 8     | Controls + Data Hardening                    | 5                   | 1–2        |
|       | **Total**                                    | **~215**            | **~21–29** |

Combined with existing 41 items → **~256/280** benchmark coverage (remaining ~24
are niche items that can be deferred).

> **Phase 0 is the single most important step.** Without it, every subsequent
> phase adds files into flat folders, making the codebase progressively harder
> to navigate, test, and debug. Do Phase 0 before writing any new feature code.

---

## Anti-Spaghetti Guardrails

These rules prevent the S2/ERPNext trap of everything-depends-on-everything:

1. **No cross-slice imports** — `slices/payables/` cannot import from
   `slices/receivables/`. Shared logic goes in `shared/` or the GL slice's
   public barrel. Enforced by arch-guard **E16**.

2. **Hooks, not hard deps** — when AP needs tax calculation, it calls a
   `ITaxCalculationHook` port defined in its own `ports/`, not
   `import { calculateTax } from '../tax/'`. The runtime wires the hook
   implementation.

3. **Calculators are leaf nodes** — a calculator never calls a service or repo.
   It receives data, returns data. This is what makes them testable without
   mocks.

4. **One journal entry point** — every slice that creates GL entries calls
   `postJournal` from the GL slice (via the `GlDeps` intersection). No slice
   writes to `gl_journal` directly.

5. **Shared types in `@afenda/contracts`** — Zod schemas for cross-slice DTOs
   (e.g., `InvoiceLineSchema`) live in contracts, not in any slice.

6. **DB schema ownership** — each slice owns its tables (prefixed by concern,
   e.g., `erp.ap_invoice`, `erp.fa_asset`). Only the GL slice owns `gl_*`
   tables. A slice can READ `gl_*` via ports but never WRITE directly.

7. **Per-slice deps, not god-interface** — each slice defines `<Slice>Deps` with
   only its repos. Services declare exactly which deps they need via
   intersection types (`GlDeps & SharedDeps`). Tests mock only the relevant
   deps.

8. **arch-guard enforcement** — E16 (no cross-slice imports), E13 (circular dep
   detection extended to slice level). CI blocks merge if violated.

9. **Co-located tests** — each slice has `__tests__/` next to its code. No
   shared test folder. Test helpers for a slice live in that slice's
   `__tests__/helpers/`.

10. **Barrel discipline** — each slice has one `index.ts` that re-exports only
    its public surface. `public.ts` and `infra.ts` import from slice barrels,
    never from internal files.

---

## Migration Strategy

Each phase produces one numbered migration file:

```
packages/db/drizzle/
├── 0001_initial.sql          ← existing
├── ...
├── 0006_recurring_budget.sql ← existing
├── 0007_ap_ar.sql            ← Phase 1
├── 0008_tax_assets_bank.sql  ← Phase 2
├── 0009_credit_expense_project.sql ← Phase 3
├── 0010_lease_provisions_treasury.sql ← Phase 4
├── 0011_cost_budget_subscription.sql ← Phase 5
├── 0012_consolidation_statutory_sla.sql ← Phase 6
├── 0013_ifrs_specialist.sql  ← Phase 7
```

All tables in `erp` schema. All have `tenant_id` + RLS. All use `bigint` for
money columns.

---

## Priority Order Rationale

```
Phase 0 (Refactor)     → MUST DO FIRST. Prevents structural debt from compounding.
Phase 1 (AP/AR)        → highest daily volume, unlocks invoicing
Phase 2 (Tax/FA/Bank)  → tax touches every invoice, assets are compliance-critical
Phase 3 (Credit/Exp/Proj) → operational efficiency, project billing
Phase 4 (Lease/Prov/Treasury) → IFRS 16 compliance, cash management
Phase 5 (Cost/Budget+/Sub+) → management accounting, extend existing
Phase 6 (Consol+/Stat+/SLA) → group reporting, formalize hub
Phase 7 (IFRS specialist) → low frequency, high complexity
Phase 8 (Hardening)    → polish, can be done incrementally
```

This order ensures each phase builds on the previous one and delivers usable
functionality at every step.

---

## Codebase Validation (2025-02-24)

> Cross-referenced every phase against the actual
> `packages/modules/finance/src/` tree. Below is the ground-truth status of each
> phase.

### Phase 0 — Refactor into Slices ✅ DONE

The slice refactor is **complete**. All 16 slices exist under `src/slices/`:

| Slice           | Files | Status                                                          |
| --------------- | ----- | --------------------------------------------------------------- |
| `gl/`           | 43    | ✅ Full (entities, calculators, ports, services, repos, routes) |
| `fx/`           | 13    | ✅ Full                                                         |
| `ic/`           | 14    | ✅ Full                                                         |
| `hub/`          | 26    | ✅ Full                                                         |
| `reporting/`    | 11    | ✅ Full                                                         |
| `ap/`           | 25    | ✅ Full (Phase 1)                                               |
| `ar/`           | ~18   | ✅ Full (Phase 1)                                               |
| `tax/`          | 27    | ✅ Full (Phase 2)                                               |
| `fixed-assets/` | 19    | ✅ Full (Phase 2)                                               |
| `bank/`         | 22    | ✅ Full (Phase 2)                                               |
| `credit/`       | 13    | ✅ Full (Phase 3)                                               |
| `expense/`      | 14    | ✅ Full (Phase 3)                                               |
| `project/`      | 12    | ✅ Full (Phase 3)                                               |
| `lease/`        | 19    | ✅ Full (Phase 4) — includes co-located tests                   |
| `provision/`    | 13    | ✅ Full (Phase 4) — includes co-located tests                   |
| `treasury/`     | 16    | ✅ Full (Phase 4) — includes co-located tests                   |

**Strangler-fig shims** still exist in `src/app/index.ts`,
`src/domain/index.ts`, `src/domain/calculators/index.ts`, `src/infra/index.ts` —
all re-export from `slices/`. Old flat folders (`app/`, `domain/`, `infra/`)
contain **only barrel re-exports**, no source logic.

**Per-slice deps**: `FinanceDeps` in `src/app/ports/finance-runtime.ts` composes
15 slice deps + `SharedDeps` via `extends`. Each slice has its own `<Slice>Deps`
interface (e.g., `gl-deps.ts`, `fx-deps.ts`, `ap-deps.ts`, etc.).

**`runtime.ts`**: Composition root wires **49 Drizzle repos** across all 16
slices. Fully up to date through Phase 4.

**`shared/`**: 17 files — authorization, idempotency, outbox, error-mapper,
fastify-plugins, rate-limit, mappers, events, currency-config, finance-context,
shared-deps. Matches plan.

### Phase 1 — AP & AR ✅ DONE

**AP slice** (`slices/ap/`): 25 files

- **Calculators** (8): `three-way-match`, `ap-aging`, `early-payment-discount`,
  `duplicate-detection`, `payment-file-builder`, `supplier-statement-recon`,
  `wht-calculator`, `accrued-liabilities` — all 10 plan items covered
  (AP-01→AP-10)
- **Entities** (3): `ap-invoice`, `payment-run`, `payment-terms`
- **Ports** (4): `ap-deps`, `ap-invoice-repo`, `payment-run-repo`,
  `payment-terms-repo` — matches plan
- **Repos** (3): Drizzle adapters for all 3 ports
- **Routes** (3): `ap-invoice-routes`, `ap-payment-run-routes`,
  `ap-aging-routes`
- **Services** (4): `post-ap-invoice`, `execute-payment-run`, `get-ap-aging`,
  `create-debit-memo`

**AR slice** (`slices/ar/`): ~18 files

- **Calculators** (9): `ar-aging`, `payment-allocation`, `ecl-provision`,
  `dunning-score`, `credit-limit`, `ic-receivable-matching`,
  `invoice-discounting`, `late-fee`, `revenue-recognition-hook` — all 10 plan
  items covered (AR-01→AR-10)
- **Entities** (3): `ar-invoice`, `ar-payment-allocation`, `dunning`
- **Ports** (4): `ar-deps`, `ar-invoice-repo`, `ar-payment-allocation-repo`,
  `dunning-repo` — matches plan
- **Repos** (3): Drizzle adapters for all 3 ports
- **Routes**: present (ar-routes via test files confirm)
- **Services**: present (ar-services via test files confirm)

**Tests**: `ap-calculators.test.ts` (19), `ap-services.test.ts` (11),
`ap-routes.test.ts` (11), `ar-calculators.test.ts` (32), `ar-services.test.ts`
(11), `ar-routes.test.ts` (11), `phase1-gap-close.test.ts` (18) = **~113 test
cases** for Phase 1 alone.

### Phase 2 — Tax, Fixed Assets, Bank Recon ✅ DONE

**Tax slice** (`slices/tax/`): 27 files

- **Calculators** (8): `tax-code-hierarchy`, `vat-netting`, `saft-export`,
  `wht-treaty`, `deferred-tax`, `tax-provision`, `country-formats`,
  `transfer-pricing` — covers TX-01→TX-10
- **Entities** (4): `tax-rate`, `tax-code`, `tax-return`, `wht-certificate`
- **Ports** (5): `tax-deps`, `tax-rate-repo`, `tax-code-repo`,
  `tax-return-repo`, `wht-certificate-repo` — matches plan
- **Repos** (4): Drizzle adapters
- **Routes** (4): `tax-rate-routes`, `tax-code-routes`, `tax-return-routes`,
  `wht-certificate-routes`
- **Services** (2): `aggregate-tax-return`, `issue-wht-certificate`

**Fixed Assets slice** (`slices/fixed-assets/`): 19 files

- **Calculators** (5): `depreciation`, `component-accounting`, `revaluation`,
  `impairment`, `disposal` — covers FA-01→FA-07
- **Entities** (4): `asset`, `asset-component`, `depreciation-schedule`,
  `asset-movement`
- **Ports** (4): `fa-deps`, `asset-repo`, `depreciation-schedule-repo`,
  `asset-movement-repo` — matches plan
- **Repos** (3): Drizzle adapters
- **Routes** (1): `asset-routes`
- **Services** (2): `run-depreciation`, `dispose-asset`
- ✅ **FA-08** bulk depreciation is handled by `run-depreciation.ts` (batch over
  all active assets). **FA-09** `transfer-asset.ts` and **FA-10**
  `capitalize-cwip.ts` services added — all plan items covered.

**Bank Recon slice** (`slices/bank/`): 22 files

- **Calculators** (6): `statement-parser`, `auto-match`, `outstanding-items`,
  `bank-charges`, `multi-currency-recon`, `intraday-balance` — covers
  BR-01→BR-10
- **Entities** (4): `bank-statement`, `bank-statement-line`, `bank-match`,
  `bank-reconciliation`
- **Ports** (4): `bank-deps`, `bank-statement-repo`, `bank-match-repo`,
  `bank-reconciliation-repo` — matches plan
- **Repos** (3): Drizzle adapters
- **Routes** (1): `bank-routes`
- **Services** (4): `auto-post-matches`, `confirm-manual-match`,
  `investigate-unmatched`, `sign-off-reconciliation`

**Tests**: `tax-calculators.test.ts` (25), `fa-calculators.test.ts` (18),
`bank-calculators.test.ts` (17), `calculators-p2.test.ts` (18) = **~78 test
cases**.

### Phase 3 — Credit, Expense, Project ✅ DONE

**Credit slice** (`slices/credit/`): 13 files — `credit-check`,
`credit-exposure`, `ecl-calculator` calculators; `credit-limit`, `credit-review`
entities; `credit-hold-release`, `bad-debt-write-off` services. Matches plan.

**Expense slice** (`slices/expense/`): 14 files — `per-diem-mileage`,
`policy-enforcement`, `fx-reimbursement` calculators; `expense-claim`,
`expense-claim-line`, `expense-policy` entities; `submit-expense-claim`,
`reimburse-expense-claim` services. Matches plan.

**Project slice** (`slices/project/`): 12 files — `earned-value`,
`pct-completion`, `project-profitability` calculators; `project`,
`project-cost-line`, `project-billing` entities; `bill-project`,
`transfer-wip-to-revenue` services. Matches plan.

**Tests**: `credit-calculators.test.ts` (15), `expense-calculators.test.ts`
(12), `project-calculators.test.ts` (11), `calculators-p3.test.ts` (21) = **~59
test cases**.

### Phase 4 — Lease, Provisions, Treasury ✅ DONE

**Lease slice** (`slices/lease/`): 19 files — 6 calculators
(`lease-recognition`, `amortization-schedule`, `lease-modification-calc`,
`lease-exemptions`, `sale-leaseback`, `lessor-classification`), 3 entities, 4
ports, 3 repos, 1 route, 1 service (`modify-lease`). Co-located
`__tests__/lease-calculators.test.ts` (13 tests). Covers LA-01→LA-06.

**Provision slice** (`slices/provision/`): 13 files — 3 calculators
(`recognition-criteria`, `discount-unwind`, `onerous-contract`), 2 entities, 3
ports, 2 repos, 1 route, 1 service (`utilise-provision`). Co-located
`__tests__/provision-calculators.test.ts` (10 tests). Covers PR-01→PR-05.

**Treasury slice** (`slices/treasury/`): 16 files — 4 calculators
(`cash-flow-forecast`, `cash-pooling`, `covenant-monitor`, `fx-exposure`), 3
entities, 4 ports, 3 repos, 1 route. Co-located
`__tests__/treasury-calculators.test.ts` (13 tests). Covers TR-01→TR-05.

- ✅ **TR-06** `manage-ic-loan.ts` service added (create, repay, interest
  accrual) — all plan items covered.

**Tests**: `calculators-p4.test.ts` (17) + co-located (36) = **~53 test cases**.

### Phase 5 — Cost Accounting, Budgeting+, Subscription+ ✅ DONE

**Cost Accounting slice** (`slices/cost-accounting/`): 20 files

- **Calculators** (7): `direct-allocation`, `step-down-allocation`,
  `reciprocal-allocation`, `activity-based-costing`, `standard-cost-variance`,
  `overhead-absorption`, `profitability-analysis` — covers CA-01→CA-06
- **Entities** (3): `cost-center`, `cost-driver`, `cost-allocation-run`
- **Ports** (4): `cost-accounting-deps`, `cost-center-repo`, `cost-driver-repo`,
  `cost-allocation-run-repo`
- **Repos** (3): Drizzle adapters for all 3 ports
- **Routes** (1): `cost-accounting-routes`
- **Services** (1): `run-allocation`
- **Events**: `COST_CENTER_CREATED`, `COST_DRIVER_CREATED`,
  `COST_ALLOCATION_COMPLETED`, `COST_ALLOCATION_REVERSED`

**Budget extensions** (hub slice calculators):

- `rolling-forecast.ts` — trend, average, growth-rate, manual override methods
- `encumbrance.ts` — PO/contract commitment tracking, over-commitment detection
- `scenario-planning.ts` — per-account and global BPS adjustments
- `budget-consolidation.ts` — multi-source aggregation with inter-unit
  elimination

**Subscription billing extensions** (hub slice calculators):

- `subscription-proration.ts` — mid-cycle upgrade/downgrade/cancellation
- `usage-metering.ts` — tiered pricing with included allowances
- `churn-mrr.ts` — MRR movement tracking, gross/net churn rates in BPS

**DB migration**: `0002_cost_budget_subscription.sql` — enums + tables for cost
accounting.

**Tests**: `cost-accounting-calculators.test.ts` (22),
`budget-extension-calculators.test.ts` (19), `subscription-calculators.test.ts`
(13) = **54 test cases** — all passing.

### Phase 6 — Consolidation+, Statutory+, SLA ✅ DONE

**Consolidation slice** (`slices/consolidation/`): 18 files

- **Calculators** (5): `group-ownership`, `nci`, `goodwill-calc`,
  `dividend-elimination`, `consolidation-journal` — covers CO-01→CO-06
- **Entities** (3): `group-entity`, `ownership-record`, `goodwill`
- **Ports** (4): `consolidation-deps`, `group-entity-repo`,
  `ownership-record-repo`, `goodwill-repo`
- **Repos** (3): Drizzle adapters for all 3 ports
- **Routes** (1): `consolidation-ext-routes`
- **Services** (1): `update-ownership`
- **Events**: `GROUP_ENTITY_CREATED`, `OWNERSHIP_CHANGED`,
  `GOODWILL_RECOGNIZED`, `GOODWILL_IMPAIRED`, `CONSOLIDATION_COMPLETED`

**Statutory reporting extensions** (reporting slice calculators):

- `equity-statement.ts` — statement of changes in equity (IFRS)
- `notes-engine.ts` — template-based notes disclosure generation
- `segment-reporting.ts` — IFRS 8 segment aggregation + inter-segment
  elimination
- `related-party.ts` — IAS 24 related party disclosure grouping
- `xbrl-tagger.ts` — XBRL taxonomy mapping + iXBRL XML fragment generation

**Subledger Architecture (SLA)** (hub slice extensions):

- `accounting-event.ts` entity — formal accounting event store
- `mapping-rule.ts` entity — versioned mapping rules
  (DRAFT→PUBLISHED→DEPRECATED)
- `multi-ledger-derivation.ts` — 1 event → N journals across multiple ledgers
- `preview-derivation.ts` — dry-run derivation with balance + warning checks

**DB schema**: `groupEntities`, `ownershipRecords`, `goodwills` tables + enums.
**Migration**: `0003_consolidation_statutory_sla.sql`.

**Tests**: `consolidation-calculators.test.ts` (18),
`statutory-calculators.test.ts` (15), `sla-calculators.test.ts` (11) = **44 test
cases** — all passing.

### Phase 7 — IFRS Specialist Modules ✅ DONE

**7a. Intangible Assets — IAS 38** (`slices/intangibles/`):

- `intangible-asset.ts` entity — mirrors fixed-asset structure with
  intangible-specific fields (category, useful life type, development phase)
- `recognition.ts` — IAS 38 recognition criteria + R&D phase gate
- `amortization.ts` — finite (SL/DB/UoP) vs indefinite life (no amortization,
  flags impairment test)
- `software-capitalization.ts` — SIC-32 software cost classification
  (preliminary/application development/post-implementation)

**7b. Financial Instruments — IFRS 9** (`slices/fin-instruments/`):

- `financial-instrument.ts` entity — classification, fair value level, EIR
- `classification.ts` — IFRS 9.4.1 decision tree (business model + SPPI test)
- `effective-interest-rate.ts` — EIR method with premium/discount amortization
- `fair-value.ts` — IFRS 13 fair value hierarchy, FVTPL→P&L / FVOCI→OCI
- `ecl.ts` — IFRS 9.5.5 expected credit loss (12-month vs lifetime, PD×LGD×EAD)
- `derecognition.ts` — IFRS 9.3.2 transfer of risks decision tree

**7c. Hedge Accounting — IFRS 9 §6** (`slices/hedge/`):

- `hedge-relationship.ts` entity — designation, type, status, OCI reserve
- `effectiveness.ts` — dollar-offset + regression methods, 80-125% band
- `oci-reserve.ts` — OCI reserve movement tracking + reclassification

**7d. Deferred Tax — IAS 12** (`slices/deferred-tax/`):

- `temporary-differences.ts` — taxable vs deductible difference identification
- `dta-dtl.ts` — DTA/DTL computation with probable-profit gate
- `rate-change-impact.ts` — rate change adjustment (P&L vs OCI routing)
- `movement-schedule.ts` — full disclosure reconciliation schedule

**7e. Transfer Pricing — OECD** (`slices/transfer-pricing/`):

- `tp-methods.ts` — CUP, resale price, cost plus, TNMM, profit split validation
- `cbcr.ts` — Country-by-Country Reporting Table 1 aggregation
- `thin-capitalization.ts` — D/E ratio + interest/EBITDA limit testing

**DB schema**: `intangibleAssets`, `financialInstruments`, `hedgeRelationships`,
`deferredTaxItems`, `tpPolicies` tables + 8 enums. **Migration**:
`0004_ifrs_specialist.sql`.

**Tests**: `intangibles-calculators.test.ts` (14),
`fin-instruments-calculators.test.ts` (22), `hedge-calculators.test.ts` (9),
`deferred-tax-calculators.test.ts` (13), `tp-calculators.test.ts` (9) = **67
test cases** — all passing.

### Phase 8 — Controls & Data Hardening ✅ DONE

**8a. Internal Controls** (`slices/controls/`):

- `subledger-reconciliation.ts` — IC-05: sub-ledger ↔ GL control account balance
  comparison, flags discrepancies across AP/AR/FA/Bank/Tax etc.
- `exception-reporting.ts` — IC-08: anomaly detection on GL journals (threshold
  breaches, round-number bias, weekend postings, duplicates, period-end
  clustering, single-line dominance)
- `access-review.ts` — IC-09: quarterly user access review (dormant accounts,
  SoD violations, orphaned accounts, role accumulation, excessive privilege,
  missing approvals)

**8b. Data Architecture Hardening**:

- `optimistic-concurrency.ts` — DA-03: version-based conflict detection for
  high-contention entities (GL balances, fiscal periods, bank reconciliations,
  cost allocation runs)
- `partition-strategy.ts` — DA-09: computes RANGE partition plans for
  gl_journal_line and gl_balance based on volume metrics, outputs DDL

**Events**: `RECONCILIATION_COMPLETED`, `RECONCILIATION_EXCEPTION`,
`EXCEPTION_REPORT_GENERATED`, `ACCESS_REVIEW_COMPLETED`,
`CONCURRENCY_CONFLICT_DETECTED`.

**Migration**: `0005_controls_hardening.sql` — adds `version` column to 4
high-contention tables + partition-ready indexes.

**Tests**: `controls-calculators.test.ts` (32) — all passing.

### Migration Status

The plan's migration numbering is **stale**. Actual state:

| Plan Says                                        | Actual                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `0001_initial.sql` → `0006_recurring_budget.sql` | `0000_baseline.sql` + `0001_rls_and_posting_guards.sql` (active)                                                       |
| —                                                | `_archive/0001_init.sql` → `_archive/0012_p4_lease_provision_treasury.sql` (12 archived)                               |
| `0007_ap_ar.sql` (Phase 1)                       | Likely folded into archived migrations                                                                                 |
| `0008` → `0013` (Phase 2–7)                      | `0002_cost_budget_subscription.sql` (P5), `0003_consolidation_statutory_sla.sql` (P6), `0004_ifrs_specialist.sql` (P7) |

Migrations were **consolidated** into `0000_baseline.sql` with originals
archived. The plan's `0007`→`0013` numbering needs updating — next migration
should be `0002_*.sql`.

### Test Count

| Source                             | Test Cases |
| ---------------------------------- | ---------- |
| `src/__tests__/` (centralized)     | ~592       |
| `slices/*/__tests__/` (co-located) | ~233       |
| **Total**                          | **~825**   |

The plan claims "245+ tests" — this was accurate at S1 baseline but is now
**significantly understated**. Current count is ~825 test cases across 62+ test
files.

### Remaining Work Summary

| Phase | Status  | Remaining Items                                                        |
| ----- | ------- | ---------------------------------------------------------------------- |
| **0** | ✅ Done | Strangler-fig shims **removed** (4 files deleted, 9 empty dirs pruned) |
| **1** | ✅ Done | —                                                                      |
| **2** | ✅ Done | FA-08/09/10 all covered (transfer-asset, capitalize-cwip added)        |
| **3** | ✅ Done | —                                                                      |
| **4** | ✅ Done | TR-06 manage-ic-loan service added                                     |
| **5** | ✅ Done | Cost accounting slice + budget/subscription extensions (54 tests)      |
| **6** | ✅ Done | Consolidation + statutory + SLA (44 tests)                             |
| **7** | ✅ Done | 5 IFRS specialist modules — full CRUD (30 files), 67 calc tests        |
| **8** | ✅ Done | Controls + data hardening — 5 calculators, 32 tests                    |

**All phases complete.** 784 tests passing across 63 test files (29 skipped).
~256/280 benchmark coverage achieved (remaining ~24 are niche items that can be
deferred). Gap remediation completed — see section below.

### Stale Sections in This Plan

> **Note (2025-06):** The items below were identified as stale during the
> codebase-vs-plan gap analysis. Items 1-7 are **acknowledged but intentionally
> preserved** as historical context. The "Gap Remediation" section below
> documents all corrections applied to close the gaps.

1. **"What S1 Already Has" (line 11–21)** — understated. Now covers Phases 0–8,
   not just S1 baseline. Preserved as historical S1 snapshot.
2. **"Existing infra" counts (line 21)** — "18 ports, 16 services, 14
   calculators, 35 endpoints, 245+ tests" is the S1 baseline. Current: ~68
   ports, ~40+ services, ~50+ calculators, 784 tests (63 files).
3. **Phase 0 section (line 140–403)** — entirely done.
4. **Phase 1–4 sections** — done.
5. **Migration numbering (line 819–835)** — stale. Migrations consolidated into
   `0000_baseline.sql`. Phase 5: `0002_cost_budget_subscription.sql`. Phase 6:
   `0003_consolidation_statutory_sla.sql`. Phase 7: `0004_ifrs_specialist.sql`.
   Phase 8: `0005_controls_hardening.sql`.
6. **Folder Convention (line 40–122)** — accurate for existing slices.
   `cost-accounting/`, `consolidation/`, `intangibles/`, `fin-instruments/`,
   `hedge/`, `deferred-tax/`, `transfer-pricing/` all exist.
7. **Total Estimate table (line 772–787)** — All phases 0–8 complete. No
   remaining sessions needed.

---

## Gap Remediation (2025-06)

> A codebase-vs-plan gap analysis identified 9 categories of drift between
> FINANCE-DEV-PLAN.md and the actual `@afenda/finance` implementation. A 12-step
> remediation plan was executed sequentially, each step verified with typecheck
> (0 errors) and full test suite (784 pass, 29 skipped).

### Gaps Identified

| #   | Gap Category                   | Severity | Description                                                     |
| --- | ------------------------------ | -------- | --------------------------------------------------------------- |
| 1   | TypeScript errors              | High     | 5 type mismatches in repos/routes (bigint mode, missing fields) |
| 2   | Missing shared types           | Medium   | 57 cross-slice imports bypassing `shared/` mediation            |
| 3   | Missing hook ports             | Medium   | 8 cross-slice calculator usages without hook port indirection   |
| 4   | Arch-guard E16 not built       | High     | No-cross-slice-imports rule declared but not enforced           |
| 5   | Missing DB tables              | High     | 8 Phase 7 tables not in Drizzle schema                          |
| 6   | Missing route wiring           | Medium   | 3 route registrars (cost-acct, consolidation, controls) unwired |
| 7   | Phase 7 slices incomplete      | High     | 5 IFRS modules had calculators only — no entities/repos/routes  |
| 8   | Missing Zod schemas            | Medium   | Phase 7 CRUD endpoints had no contract schemas                  |
| 9   | Strangler-fig shims still live | Low      | 4 barrel re-export shims + 9 empty legacy directories           |

### Remediation Steps Completed

| Step | Action                            | Files Changed | Key Metrics                                    |
| ---- | --------------------------------- | ------------- | ---------------------------------------------- |
| 1    | Fix 5 TypeScript errors           | 5             | 0 TS errors (was 5)                            |
| 2    | Extract shared types to `shared/` | 57 imports    | Cross-slice imports eliminated                 |
| 3    | Add hook ports for cross-slice    | 8 port files  | 45 imports redirected through hooks            |
| 4    | Build arch-guard E16              | 1             | 126 PASS / 0 FAIL for finance                  |
| 5    | Add 8 missing DB tables           | 2 + migration | 8 tables, 5 enums, `0004_ifrs_specialist.sql`  |
| 6    | Wire 3 missing route registrars   | 2             | All route registrars wired in API entrypoint   |
| 7    | Complete Phase 7 CRUD slices      | 30 created    | Entities, ports, repos, routes for 5 modules   |
| 8    | Add missing Zod schemas           | 1 (~150 LOC)  | 20 schemas in `@afenda/contracts`              |
| 9    | Remove strangler-fig shims        | 17 modified   | 4 shims deleted, 9 empty dirs removed          |
| 10   | Fix barrel completeness           | 3             | ~95 lines added to `public.ts`, manifest fixed |
| 11   | Fix CI integration tests          | 2             | `beforeEach` import, `@afenda/db` path fixed   |
| 12   | Update dev plan document          | 1             | This section                                   |

### Post-Remediation Baselines

| Metric                   | Value                             |
| ------------------------ | --------------------------------- |
| TypeScript errors        | **0**                             |
| Test files passing       | **63** (2 integration skipped)    |
| Test cases passing       | **784** (29 skipped)              |
| Arch-guard (finance)     | **126 PASS / 0 FAIL**             |
| Arch-guard (global)      | 326 PASS / 40 FAIL (pre-existing) |
| Phase 7 CRUD files       | 30 new files across 5 slices      |
| Contract schemas         | 20 new Zod schemas                |
| Strangler-fig shims      | **0** (all removed)               |
| Legacy empty directories | **0** (all pruned)                |

### Architectural Changes

- **`public.ts`**: ~460 lines — complete barrel for all 24 slices (with conflict
  aliases: `computeFinEcl`, `FinEclInput`, `FinEclResult`, `DtMovementType`,
  `DeferredTaxItemEntity`)
- **`infra.ts`**: ~200 lines — repos + routes for all slices
- **`runtime.ts`**: ~180 lines — wires 57 Drizzle repos across 22 slices
- **`FinanceDeps`**: extends 22 slice deps + `SharedDeps`
- **ARCHITECTURE manifest**: `required_directories` updated to
  `["src/app", "src/app/ports", "src/shared", "src/slices"]`;
  `allow_imports_by_path` updated to `src/slices/*/routes/**` and
  `src/slices/*/repos/**`
- **Arch-guard**: `toArray()` helper added for YAML parser robustness; 5 `|| []`
  patterns replaced with `Array.isArray()` checks

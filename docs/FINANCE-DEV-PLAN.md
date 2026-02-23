# Finance Module Development Plan

> Bring `@afenda/finance` (S1) to full S2 feature parity using S1's superior architecture.
>
> **Principle**: One package (`@afenda/finance`), many domain slices — not 37 packages.
> Each slice is a folder under `src/domain/` with its own calculators, ports, services, and routes.
> No ERP spaghetti. No cross-slice coupling. Every slice talks to GL via the existing posting spine.

---

## What S1 Already Has (41/280 benchmark items)

- Foundation Controls (7/7)
- Core GL + Double-Entry (12/12)
- Foreign Exchange (5/5)
- Intercompany (4/4)
- Accounting Hub (4/4)
- Recurring & Automated Entries (3/3)
- Financial Reporting (6/6)

**Existing infra**: 18 ports, 16 services, 14 calculators, 35 HTTP endpoints, 245+ tests, RLS, idempotency, audit trail, integer money.

---

## Architecture Rules (Non-Negotiable)

1. **Single package** — all slices live in `@afenda/finance`. No new workspace packages.
2. **Slice isolation** — each slice is a folder under `src/slices/<name>/` with co-located `entities/`, `calculators/`, `ports/`, `services/`, `repos/`, `routes/`. A slice may only import from `shared/` and its own folder. **No cross-slice imports** — enforced by arch-guard E16.
3. **GL spine is the only write path** — every slice that creates accounting entries calls `postJournal` (or emits an AccountingEvent for the hub). No direct GL writes.
4. **Ports before repos** — define the interface first (`I<Name>Repo`), implement Drizzle adapter second. Tests mock the port.
5. **Calculators are pure** — zero DB, zero side effects, 100% unit-testable. A calculator never calls a service or repo.
6. **Per-slice deps** — each slice defines its own `<Slice>Deps` interface. Services receive `SliceDeps & SharedDeps`, not a god-interface. `FinanceDeps` is composed via `extends` at the runtime level only.
7. **One migration per phase** — each phase adds its DB tables in a single numbered migration.
8. **Route registrar pattern** — each slice exports `register<Slice>Routes(app, deps)`, wired in `runtime.ts`.
9. **Cross-slice communication via hooks** — when slice A needs logic from slice B (e.g., AP needs tax calculation), it calls a hook port (`ITaxCalculationHook`), not a direct import. The runtime wires the hook.
10. **Shared types in `@afenda/contracts`** — Zod schemas for cross-slice DTOs (e.g., `InvoiceLineSchema`) live in the contracts package, not in any slice.

---

## Folder Convention (Target State)

Every slice is **self-contained**: entities, calculators, ports, services, repos, routes, and tests co-located.

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

> **Goal**: Move the current 111 flat files into the slice structure above.
> Zero new features. Zero new tests. Only file moves + import rewrites.
> Every test must pass before and after. Typecheck must stay clean.

### Why This Is Non-Negotiable

The current structure has **5 flat folders** holding all concerns:

| Current Folder | Files | Problem |
|---------------|-------|---------|
| `domain/calculators/` | 19 | GL, FX, IC, Hub, Reporting all mixed |
| `domain/entities/` | 15 | Same mix |
| `app/ports/` | 20 | Same mix |
| `app/services/` | 21 | Same mix |
| `infra/repositories/` | 18 | Same mix |
| `infra/routes/` | 20 | Same mix |

Adding AP/AR (Phase 1) into these flat folders would push each to 25+ files with no way to tell what belongs to what. By Phase 3 you'd have 40+ files per folder — the exact ERP spaghetti we're avoiding.

### The `FinanceDeps` God-Interface Problem

Currently `FinanceDeps` is a single interface with **19 repos**. By Phase 3 it would have 30+. This causes:

- Every service receives every repo (no compile-time scoping)
- Every test must mock 19 repos even if the service uses 2
- Adding a repo requires touching the god-interface, the runtime, and every test factory

**Fix**: Replace with **per-slice deps interfaces** composed at the runtime level.

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
export interface FinanceDeps extends GlDeps, FxDeps, IcDeps, HubDeps, SharedDeps {}
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

| Current Path | Target Path |
|-------------|-------------|
| `domain/entities/journal.ts` | `slices/gl/entities/journal.ts` |
| `domain/entities/account.ts` | `slices/gl/entities/account.ts` |
| `domain/entities/fiscal-period.ts` | `slices/gl/entities/fiscal-period.ts` |
| `domain/entities/gl-balance.ts` | `slices/gl/entities/gl-balance.ts` |
| `domain/entities/ledger.ts` | `slices/gl/entities/ledger.ts` |
| `domain/entities/journal-audit.ts` | `slices/gl/entities/journal-audit.ts` |
| `domain/calculators/journal-balance.ts` | `slices/gl/calculators/journal-balance.ts` |
| `domain/calculators/coa-hierarchy.ts` | `slices/gl/calculators/coa-hierarchy.ts` |
| `domain/calculators/trial-balance.ts` | `slices/gl/calculators/trial-balance.ts` |
| `domain/calculators/segment-dimension.ts` | `slices/gl/calculators/segment-dimension.ts` |
| `app/ports/journal-repo.ts` | `slices/gl/ports/journal-repo.ts` |
| `app/ports/account-repo.ts` | `slices/gl/ports/account-repo.ts` |
| `app/ports/fiscal-period-repo.ts` | `slices/gl/ports/fiscal-period-repo.ts` |
| `app/ports/gl-balance-repo.ts` | `slices/gl/ports/gl-balance-repo.ts` |
| `app/ports/ledger-repo.ts` | `slices/gl/ports/ledger-repo.ts` |
| `app/ports/journal-audit-repo.ts` | `slices/gl/ports/journal-audit-repo.ts` |
| `app/ports/period-audit-repo.ts` | `slices/gl/ports/period-audit-repo.ts` |
| `app/ports/document-number-generator.ts` | `slices/gl/ports/document-number-generator.ts` |
| `app/services/create-journal.ts` | `slices/gl/services/create-journal.ts` |
| `app/services/post-journal.ts` | `slices/gl/services/post-journal.ts` |
| `app/services/get-journal.ts` | `slices/gl/services/get-journal.ts` |
| `app/services/reverse-journal.ts` | `slices/gl/services/reverse-journal.ts` |
| `app/services/void-journal.ts` | `slices/gl/services/void-journal.ts` |
| `app/services/get-trial-balance.ts` | `slices/gl/services/get-trial-balance.ts` |
| `app/services/close-period.ts` | `slices/gl/services/close-period.ts` |
| `app/services/lock-period.ts` | `slices/gl/services/lock-period.ts` |
| `app/services/reopen-period.ts` | `slices/gl/services/reopen-period.ts` |
| `app/services/close-year.ts` | `slices/gl/services/close-year.ts` |
| `app/services/process-recurring-journals.ts` | `slices/gl/services/process-recurring-journals.ts` |
| `infra/repositories/drizzle-journal-repo.ts` | `slices/gl/repos/drizzle-journal-repo.ts` |
| `infra/repositories/drizzle-account-repo.ts` | `slices/gl/repos/drizzle-account-repo.ts` |
| `infra/repositories/drizzle-period-repo.ts` | `slices/gl/repos/drizzle-period-repo.ts` |
| `infra/repositories/drizzle-balance-repo.ts` | `slices/gl/repos/drizzle-balance-repo.ts` |
| `infra/repositories/drizzle-journal-audit-repo.ts` | `slices/gl/repos/drizzle-journal-audit-repo.ts` |
| `infra/repositories/drizzle-period-audit-repo.ts` | `slices/gl/repos/drizzle-period-audit-repo.ts` |
| `infra/repositories/drizzle-document-number-generator.ts` | `slices/gl/repos/drizzle-document-number-generator.ts` |
| `infra/repositories/drizzle-ledger-repo.ts` | `slices/gl/repos/drizzle-ledger-repo.ts` |
| `infra/routes/journal-routes.ts` | `slices/gl/routes/journal-routes.ts` |
| `infra/routes/account-routes.ts` | `slices/gl/routes/account-routes.ts` |
| `infra/routes/period-routes.ts` | `slices/gl/routes/period-routes.ts` |
| `infra/routes/balance-routes.ts` | `slices/gl/routes/balance-routes.ts` |
| `infra/routes/ledger-routes.ts` | `slices/gl/routes/ledger-routes.ts` |

#### → `slices/fx/`

| Current Path | Target Path |
|-------------|-------------|
| `domain/entities/fx-rate.ts` | `slices/fx/entities/fx-rate.ts` |
| `domain/entities/fx-rate-approval.ts` | `slices/fx/entities/fx-rate-approval.ts` |
| `domain/calculators/fx-convert.ts` | `slices/fx/calculators/fx-convert.ts` |
| `domain/calculators/fx-revaluation.ts` | `slices/fx/calculators/fx-revaluation.ts` |
| `domain/calculators/fx-translation.ts` | `slices/fx/calculators/fx-translation.ts` |
| `domain/calculators/fx-triangulation.ts` | `slices/fx/calculators/fx-triangulation.ts` |
| `app/ports/fx-rate-repo.ts` | `slices/fx/ports/fx-rate-repo.ts` |
| `app/ports/fx-rate-approval-repo.ts` | `slices/fx/ports/fx-rate-approval-repo.ts` |
| `infra/repositories/drizzle-fx-rate-repo.ts` | `slices/fx/repos/drizzle-fx-rate-repo.ts` |
| `infra/repositories/drizzle-fx-rate-approval-repo.ts` | `slices/fx/repos/drizzle-fx-rate-approval-repo.ts` |
| `infra/routes/fx-rate-routes.ts` | `slices/fx/routes/fx-rate-routes.ts` |
| `infra/routes/fx-rate-approval-routes.ts` | `slices/fx/routes/fx-rate-approval-routes.ts` |

#### → `slices/ic/`

| Current Path | Target Path |
|-------------|-------------|
| `domain/entities/intercompany.ts` | `slices/ic/entities/intercompany.ts` |
| `domain/entities/ic-settlement.ts` | `slices/ic/entities/ic-settlement.ts` |
| `domain/calculators/ic-elimination.ts` | `slices/ic/calculators/ic-elimination.ts` |
| `domain/calculators/ic-aging.ts` | `slices/ic/calculators/ic-aging.ts` |
| `app/ports/ic-repo.ts` | `slices/ic/ports/ic-repo.ts` |
| `app/ports/ic-settlement-repo.ts` | `slices/ic/ports/ic-settlement-repo.ts` |
| `app/services/create-ic-transaction.ts` | `slices/ic/services/create-ic-transaction.ts` |
| `app/services/settle-ic-documents.ts` | `slices/ic/services/settle-ic-documents.ts` |
| `infra/repositories/drizzle-ic-repo.ts` | `slices/ic/repos/drizzle-ic-repo.ts` |
| `infra/repositories/drizzle-ic-settlement-repo.ts` | `slices/ic/repos/drizzle-ic-settlement-repo.ts` |
| `infra/routes/ic-routes.ts` | `slices/ic/routes/ic-routes.ts` |
| `infra/routes/ic-agreement-routes.ts` | `slices/ic/routes/ic-agreement-routes.ts` |
| `infra/routes/settlement-routes.ts` | `slices/ic/routes/settlement-routes.ts` |

#### → `slices/hub/`

| Current Path | Target Path |
|-------------|-------------|
| `domain/entities/classification-rule.ts` | `slices/hub/entities/classification-rule.ts` |
| `domain/entities/revenue-recognition.ts` | `slices/hub/entities/revenue-recognition.ts` |
| `domain/entities/budget.ts` | `slices/hub/entities/budget.ts` |
| `domain/entities/recurring-template.ts` | `slices/hub/entities/recurring-template.ts` |
| `domain/calculators/derivation-engine.ts` | `slices/hub/calculators/derivation-engine.ts` |
| `domain/calculators/accrual-engine.ts` | `slices/hub/calculators/accrual-engine.ts` |
| `domain/calculators/revenue-recognition.ts` | `slices/hub/calculators/revenue-recognition.ts` |
| `domain/calculators/deferred-revenue.ts` | `slices/hub/calculators/deferred-revenue.ts` |
| `domain/calculators/variance-alerts.ts` | `slices/hub/calculators/variance-alerts.ts` |
| `app/ports/classification-rule-repo.ts` | `slices/hub/ports/classification-rule-repo.ts` |
| `app/ports/revenue-contract-repo.ts` | `slices/hub/ports/revenue-contract-repo.ts` |
| `app/ports/budget-repo.ts` | `slices/hub/ports/budget-repo.ts` |
| `app/ports/recurring-template-repo.ts` | `slices/hub/ports/recurring-template-repo.ts` |
| `app/services/recognize-revenue.ts` | `slices/hub/services/recognize-revenue.ts` |
| `app/services/get-budget-variance.ts` | `slices/hub/services/get-budget-variance.ts` |
| `app/services/consolidate.ts` | `slices/hub/services/consolidate.ts` |
| `infra/repositories/drizzle-classification-rule-repo.ts` | `slices/hub/repos/drizzle-classification-rule-repo.ts` |
| `infra/repositories/drizzle-revenue-contract-repo.ts` | `slices/hub/repos/drizzle-revenue-contract-repo.ts` |
| `infra/repositories/drizzle-budget-repo.ts` | `slices/hub/repos/drizzle-budget-repo.ts` |
| `infra/repositories/drizzle-recurring-template-repo.ts` | `slices/hub/repos/drizzle-recurring-template-repo.ts` |
| `infra/routes/classification-rule-routes.ts` | `slices/hub/routes/classification-rule-routes.ts` |
| `infra/routes/revenue-routes.ts` | `slices/hub/routes/revenue-routes.ts` |
| `infra/routes/budget-routes.ts` | `slices/hub/routes/budget-routes.ts` |
| `infra/routes/recurring-template-routes.ts` | `slices/hub/routes/recurring-template-routes.ts` |
| `infra/routes/consolidation-routes.ts` | `slices/hub/routes/consolidation-routes.ts` |

#### → `slices/reporting/`

| Current Path | Target Path |
|-------------|-------------|
| `domain/entities/financial-reports.ts` | `slices/reporting/entities/financial-reports.ts` |
| `domain/calculators/report-classifier.ts` | `slices/reporting/calculators/report-classifier.ts` |
| `domain/calculators/cash-flow-indirect.ts` | `slices/reporting/calculators/cash-flow-indirect.ts` |
| `domain/calculators/comparative-report.ts` | `slices/reporting/calculators/comparative-report.ts` |
| `domain/calculators/close-checklist.ts` | `slices/reporting/calculators/close-checklist.ts` |
| `app/services/get-balance-sheet.ts` | `slices/reporting/services/get-balance-sheet.ts` |
| `app/services/get-income-statement.ts` | `slices/reporting/services/get-income-statement.ts` |
| `app/services/get-cash-flow.ts` | `slices/reporting/services/get-cash-flow.ts` |
| `app/services/get-comparative-balance-sheet.ts` | `slices/reporting/services/get-comparative-balance-sheet.ts` |
| `app/services/get-comparative-income-statement.ts` | `slices/reporting/services/get-comparative-income-statement.ts` |
| `infra/routes/report-routes.ts` | `slices/reporting/routes/report-routes.ts` |

#### → `shared/`

| Current Path | Target Path |
|-------------|-------------|
| `app/ports/idempotency-store.ts` | `shared/ports/idempotency-store.ts` |
| `app/ports/outbox-writer.ts` | `shared/ports/outbox-writer.ts` |
| `app/ports/authorization.ts` | `shared/ports/authorization.ts` |
| `app/ports/finance-runtime.ts` | `shared/ports/finance-deps.ts` (rewritten — see above) |
| `infra/repositories/drizzle-idempotency.ts` | `shared/repos/drizzle-idempotency.ts` |
| `infra/repositories/drizzle-outbox-writer.ts` | `shared/repos/drizzle-outbox-writer.ts` |
| `infra/routes/error-mapper.ts` | `shared/routes/error-mapper.ts` |
| `infra/routes/fastify-plugins.ts` | `shared/routes/fastify-plugins.ts` |
| `infra/routes/authorization-guard.ts` | `shared/routes/authorization-guard.ts` |
| `infra/routes/rate-limit-guard.ts` | `shared/routes/rate-limit-guard.ts` |
| `infra/authorization/default-authorization-policy.ts` | `shared/authorization/default-authorization-policy.ts` |
| `infra/mappers/*` | `shared/mappers/*` |
| `domain/events.ts` | `shared/events.ts` |

### Phase 0 Execution Steps

1. **Create slice directories** — `slices/gl/`, `slices/fx/`, `slices/ic/`, `slices/hub/`, `slices/reporting/`, `shared/`
2. **Move files** — follow the file move map above (git mv for clean history)
3. **Rewrite imports** — update all `import` paths. Use IDE refactor or `sed` for bulk rewrite.
4. **Create slice barrel files** — each `slices/<name>/index.ts` re-exports public types
5. **Split `FinanceDeps`** — create `GlDeps`, `FxDeps`, `IcDeps`, `HubDeps`, `ReportingDeps`, `SharedDeps` per-slice deps interfaces. `FinanceDeps` becomes `extends GlDeps & FxDeps & IcDeps & HubDeps & SharedDeps`.
6. **Update `public.ts`** — re-export from `slices/*/index.ts` instead of flat paths
7. **Update `infra.ts`** — re-export repos and routes from `slices/*/repos/` and `slices/*/routes/`
8. **Update `runtime.ts`** — compose per-slice deps into `FinanceDeps`
9. **Run typecheck** — `pnpm typecheck` must pass
10. **Run tests** — `pnpm test` must pass with zero changes to test logic
11. **Run arch-guard** — add **E16** rule: `no import from slices/<other-slice>/` (only `shared/` and own slice allowed)
12. **Delete empty old folders** — `app/`, `domain/`, `infra/` (now empty after moves)

### Phase 0 Verification Checklist

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm test` — all 245+ tests pass, zero test file changes
- [ ] `pnpm lint` — clean
- [ ] `pnpm arch:guard` — E16 passes (no cross-slice imports)
- [ ] `git diff --stat` — only renames + import rewrites, no logic changes
- [ ] `public.ts` exports unchanged (same symbols, different paths)
- [ ] `infra.ts` exports unchanged (same symbols, different paths)
- [ ] `apps/api` and `apps/worker` compile without changes (they import from barrel only)

### Estimated Effort

1 session. Pure mechanical refactor. No feature changes, no test changes.

---

## Phase 1 — Sub-Ledgers: AP & AR

**Why first**: Every business needs invoices and payments. Highest daily transaction volume. Unlocks 20 benchmark items.

### 1a. Accounts Payable (AP-01 → AP-10)

| Item | What to Build | Type |
|------|--------------|------|
| AP-01 | 3-way match engine (PO ref → receipt ref → invoice) | calculator |
| AP-02 | Supplier aging report (current/30/60/90/90+) | calculator + service |
| AP-03 | Payment run (batch by due date, currency, supplier) | service |
| AP-04 | Early payment discount (2/10 net 30 terms) | calculator |
| AP-05 | Supplier statement reconciliation | service |
| AP-06 | ISO 20022 pain.001 payment file generation | calculator (pure XML builder) |
| AP-07 | WHT at payment (link to tax slice later) | calculator hook |
| AP-08 | Debit memo / credit note (negative invoice) | service (reuses postJournal) |
| AP-09 | Duplicate invoice detection (supplier + ref + amount + date) | calculator |
| AP-10 | Accrued liabilities (uninvoiced receipts) | calculator + service |

**DB tables**: `erp.ap_invoice`, `erp.ap_invoice_line`, `erp.ap_payment_run`, `erp.ap_payment_run_item`, `erp.payment_terms_template`, `erp.payment_terms_line`

**Ports**: `IApInvoiceRepo`, `IApPaymentRunRepo`, `IPaymentTermsRepo`

**Routes**: `POST /ap-invoices`, `GET /ap-invoices`, `GET /ap-invoices/:id`, `POST /ap-invoices/:id/post`, `POST /ap-payment-runs`, `POST /ap-payment-runs/:id/execute`, `GET /reports/ap-aging`

**Tests**: ~40 unit (calculators + services), ~10 route tests

### 1b. Accounts Receivable (AR-01 → AR-10)

| Item | What to Build | Type |
|------|--------------|------|
| AR-01 | Customer invoice with line-level tax | service (reuses postJournal) |
| AR-02 | Payment allocation (FIFO or specific) | calculator |
| AR-03 | Customer aging report | calculator + service |
| AR-04 | ECL provisioning (IFRS 9 simplified approach) | calculator |
| AR-05 | Write-off workflow with approval | service + authorization guard |
| AR-06 | Dunning (escalating letter generation) | calculator + service |
| AR-07 | Credit note / return (negative invoice) | service |
| AR-08 | IC receivable matching (link to IC slice) | calculator hook |
| AR-09 | Invoice discounting / factoring | service |
| AR-10 | Revenue recognition integration (link to hub) | service hook |

**DB tables**: `erp.ar_invoice`, `erp.ar_invoice_line`, `erp.ar_payment_allocation`, `erp.dunning_run`, `erp.dunning_letter`

**Ports**: `IArInvoiceRepo`, `IArPaymentAllocationRepo`, `IDunningRepo`

**Routes**: `POST /ar-invoices`, `GET /ar-invoices`, `GET /ar-invoices/:id`, `POST /ar-invoices/:id/post`, `POST /ar-invoices/:id/allocate-payment`, `POST /ar-invoices/:id/write-off`, `POST /dunning-runs`, `GET /reports/ar-aging`

**Tests**: ~40 unit, ~10 route tests

**Migration**: `0007_ap_ar_tables.sql`

**Estimated effort**: 2–3 sessions

---

## Phase 2 — Tax, Fixed Assets, Bank Reconciliation

**Why second**: Tax touches every invoice (AP/AR dependency). Fixed assets are high-value, low-frequency. Bank recon is daily ops.

### 2a. Tax Engine (TX-01 → TX-10)

| Item | What to Build | Type |
|------|--------------|------|
| TX-01 | Multi-jurisdiction rate tables | port + repo |
| TX-02 | Tax code hierarchy (country → state → city) | calculator (tree lookup) |
| TX-03 | Input vs output tax netting (VAT/GST) | calculator |
| TX-04 | Tax return aggregation by period | service + report |
| TX-05 | SAF-T export | calculator (pure XML/JSON builder) |
| TX-06 | WHT per payee + treaty rates | calculator (extends AP-07) |
| TX-07 | Deferred tax temporary differences | calculator (IAS 12) |
| TX-08 | Tax provision calculation | service |
| TX-09 | Country-specific formats (MY SST, SG GST) | calculator (pluggable formatters) |
| TX-10 | Transfer pricing arm's-length validation | calculator hook (link to TP slice) |

**DB tables**: `erp.tax_rate`, `erp.tax_code`, `erp.tax_return_period`, `erp.wht_certificate`

**Ports**: `ITaxRateRepo`, `ITaxCodeRepo`, `ITaxReturnRepo`, `IWhtCertificateRepo`

### 2b. Fixed Assets (FA-01 → FA-10)

| Item | What to Build | Type |
|------|--------------|------|
| FA-01 | Asset register (cost, accum depr, NBV) | port + repo |
| FA-02 | Depreciation methods (SL, DB, UoP) | calculator (pure, strategy pattern) |
| FA-03 | Useful life + residual value review | service |
| FA-04 | Component accounting | calculator (split asset into components) |
| FA-05 | Revaluation model (fair value → OCI) | calculator + service |
| FA-06 | Impairment testing (IAS 36) | calculator |
| FA-07 | Disposal (gain/loss = proceeds − NBV) | calculator + service (posts journal) |
| FA-08 | Bulk depreciation run | service (batch, idempotent per period) |
| FA-09 | Asset transfer between companies | service (IC journal pair) |
| FA-10 | CWIP → asset capitalization | service |

**DB tables**: `erp.asset`, `erp.asset_component`, `erp.depreciation_schedule`, `erp.asset_movement`

**Ports**: `IAssetRepo`, `IDepreciationScheduleRepo`, `IAssetMovementRepo`

### 2c. Bank Reconciliation (BR-01 → BR-10)

| Item | What to Build | Type |
|------|--------------|------|
| BR-01 | Bank statement import (OFX, MT940, camt.053) | calculator (parser, pure) |
| BR-02 | Auto-matching (amount + date + reference) | calculator (scoring algorithm) |
| BR-03 | Manual match for complex transactions | service |
| BR-04 | Auto-post confirmed matches to GL | service (posts journal) |
| BR-05 | Unmatched item investigation workflow | service + status machine |
| BR-06 | Outstanding checks / deposits-in-transit | calculator |
| BR-07 | Bank charges auto-recognition | calculator (rule-based) |
| BR-08 | Multi-currency reconciliation | calculator (extends FX) |
| BR-09 | Reconciliation sign-off with evidence | service + audit trail |
| BR-10 | Intraday balance monitoring | calculator + service |

**DB tables**: `erp.bank_statement`, `erp.bank_statement_line`, `erp.bank_match`, `erp.bank_reconciliation`

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

**DB tables**: `erp.expense_claim`, `erp.expense_claim_line`, `erp.expense_policy`

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

**DB tables**: `erp.lease_contract`, `erp.lease_schedule`, `erp.lease_modification`

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

S1 already has `IBudgetRepo`, `getBudgetVariance`, `variance-alerts.ts`. Extend with:

- Budget versions (original/revised/latest) — add `version` column
- Budget consolidation across companies — calculator
- Rolling forecast vs static — calculator
- Budget commitment on PO (encumbrance) — service hook
- Scenario planning (base/upside/downside) — calculator
- Budget import from spreadsheet — calculator (CSV/XLSX parser)

### 5c. Subscription Billing Extensions (SB-01 → SB-10)

S1 already has `IRecurringTemplateRepo`, `processRecurringJournals`, `revenue-recognition.ts`. Extend with:

- Upgrade / downgrade proration — calculator
- Usage-based billing metering — port + service
- Churn tracking / MRR/ARR reporting — calculator
- Payment gateway integration — port (abstract, no vendor lock-in)

**Migration**: `0011_cost_budget_subscription.sql`

**Estimated effort**: 2–3 sessions

---

## Phase 6 — Consolidation+, Statutory Reporting+

### 6a. Consolidation Extensions (CO-01 → CO-10)

S1 already has `ic-elimination.ts`, `fx-translation.ts`, `consolidation-routes.ts`. Extend with:

- Group ownership hierarchy — port + calculator
- Non-controlling interest (NCI) — calculator
- Goodwill on acquisition (IFRS 3) — calculator
- Ownership % change over time — service
- Dividend elimination — calculator
- Consolidation journal auto-generation — service (batch)

**DB tables**: `erp.group_entity`, `erp.ownership_record`, `erp.goodwill`

### 6b. Statutory Reporting Extensions (SR-01 → SR-10)

S1 already has balance sheet, income statement, cash flow, comparative reports. Extend with:

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

**DB tables**: `erp.accounting_event`, `erp.mapping_rule`, `erp.mapping_rule_version`

**Migration**: `0012_consolidation_statutory_sla.sql`

**Estimated effort**: 3–4 sessions

---

## Phase 7 — IFRS Specialist Modules

These are lower-frequency, higher-complexity standards. Most are pure calculators with thin DB persistence.

### 7a. Intangible Assets — IAS 38 (IA-01 → IA-10)

- Recognition criteria check, R&D phase gate
- Amortization (finite vs indefinite life) — calculator (reuse depreciation strategy)
- Impairment test for indefinite-life — calculator (reuse FA-06)
- Software capitalization rules

**DB tables**: `erp.intangible_asset` (mirrors `erp.asset` structure)

### 7b. Financial Instruments — IFRS 9 (FI-01 → FI-10)

- Classification engine (AC / FVOCI / FVTPL) — calculator (business model + SPPI test)
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

S1 already has SoD, authorization, audit trail, period lock, idempotency, four-eyes. Add:

- Reconciliation controls (sub-ledger = GL) — calculator + scheduled job
- Exception reporting — service (anomaly detection on GL)
- User access review (quarterly) — report + service

### 8b. Data Architecture (DA-03, DA-09)

S1 already has integer money, RLS, soft delete, effective dating, idempotency, audit log, read replicas. Add:

- Optimistic concurrency (`expectedVersion` on high-contention entities)
- Table partitioning strategy for `gl_journal_line`, `gl_balance` (range by period)

**No new migration** — these are ALTER statements on existing tables.

**Estimated effort**: 1–2 sessions

---

## Total Estimate

| Phase | Scope | New Benchmark Items | Sessions |
|-------|-------|-------------------|----------|
| **0** | **Refactor into slices + split FinanceDeps** | **0 (structural)** | **1** |
| 1 | AP + AR | 20 | 2–3 |
| 2 | Tax + Fixed Assets + Bank Recon | 30 | 3–4 |
| 3 | Credit + Expense + Project | 30 | 2–3 |
| 4 | Lease + Provisions + Treasury | 30 | 3–4 |
| 5 | Cost Accounting + Budget+ + Subscription+ | 24 | 2–3 |
| 6 | Consolidation+ + Statutory+ + SLA | 26 | 3–4 |
| 7 | IFRS Specialist (5 modules) | 50 | 4–5 |
| 8 | Controls + Data Hardening | 5 | 1–2 |
| | **Total** | **~215** | **~21–29** |

Combined with existing 41 items → **~256/280** benchmark coverage (remaining ~24 are niche items that can be deferred).

> **Phase 0 is the single most important step.** Without it, every subsequent phase adds files into flat folders, making the codebase progressively harder to navigate, test, and debug. Do Phase 0 before writing any new feature code.

---

## Anti-Spaghetti Guardrails

These rules prevent the S2/ERPNext trap of everything-depends-on-everything:

1. **No cross-slice imports** — `slices/payables/` cannot import from `slices/receivables/`. Shared logic goes in `shared/` or the GL slice's public barrel. Enforced by arch-guard **E16**.

2. **Hooks, not hard deps** — when AP needs tax calculation, it calls a `ITaxCalculationHook` port defined in its own `ports/`, not `import { calculateTax } from '../tax/'`. The runtime wires the hook implementation.

3. **Calculators are leaf nodes** — a calculator never calls a service or repo. It receives data, returns data. This is what makes them testable without mocks.

4. **One journal entry point** — every slice that creates GL entries calls `postJournal` from the GL slice (via the `GlDeps` intersection). No slice writes to `gl_journal` directly.

5. **Shared types in `@afenda/contracts`** — Zod schemas for cross-slice DTOs (e.g., `InvoiceLineSchema`) live in contracts, not in any slice.

6. **DB schema ownership** — each slice owns its tables (prefixed by concern, e.g., `erp.ap_invoice`, `erp.fa_asset`). Only the GL slice owns `gl_*` tables. A slice can READ `gl_*` via ports but never WRITE directly.

7. **Per-slice deps, not god-interface** — each slice defines `<Slice>Deps` with only its repos. Services declare exactly which deps they need via intersection types (`GlDeps & SharedDeps`). Tests mock only the relevant deps.

8. **arch-guard enforcement** — E16 (no cross-slice imports), E13 (circular dep detection extended to slice level). CI blocks merge if violated.

9. **Co-located tests** — each slice has `__tests__/` next to its code. No shared test folder. Test helpers for a slice live in that slice's `__tests__/helpers/`.

10. **Barrel discipline** — each slice has one `index.ts` that re-exports only its public surface. `public.ts` and `infra.ts` import from slice barrels, never from internal files.

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

All tables in `erp` schema. All have `tenant_id` + RLS. All use `bigint` for money columns.

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

This order ensures each phase builds on the previous one and delivers usable functionality at every step.

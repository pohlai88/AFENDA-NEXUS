# AIS Benchmark Audit — Finance Spine

Cross-reference of `docs/ais.finance.md` (stack-agnostic benchmark) against the
`@afenda/finance` codebase. Uses the **ais.finance.md numbering** as the
canonical reference.

> Last audited: 2026-02-23 (updated: gaps closed)

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented, tested, and wired to routes |
| 🔧 | Partially implemented (service or calculator exists, but gaps remain) |
| ⏳ | Not yet started |

---

## A) Foundation Controls (INF-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| INF-01 | Tenant isolation | ✅ | `tenantId` on all 27 tables, RLS policies, `withTenant()` SET LOCAL, `cross-tenant-isolation.test.ts` (10 tests, skipped without DB) |
| INF-02 | Company boundary | ✅ | `FinanceContext.companyId` threaded through 15+ services, `companyId` on ledger/journal, IC-only cross-company |
| INF-03 | Ledger boundary | ✅ | `ledgerId` required on journal, `ILedgerRepo.findById()` validates existence, base currency derived from ledger |
| INF-04 | Fiscal period governance | ✅ | `closePeriod`/`lockPeriod`/`reopenPeriod` services, period status check in `postJournal`, reason required (Zod), `IPeriodAuditRepo` logs transitions |
| INF-05 | Idempotency & exactly-once | ✅ | `IIdempotencyStore` claim-or-get pattern, `idempotency.test.ts`, idempotency-key header on POST routes |
| INF-06 | Audit trail completeness | ✅ | `IJournalAuditRepo` + `IPeriodAuditRepo`, all state transitions logged with actor/time/reason, 7 event handlers in worker |
| INF-07 | Immutability of posted facts | ✅ | `postJournal` sets status=POSTED (irreversible), `voidJournal` rejects non-DRAFT, `reverseJournal` creates additive mirror, DB triggers enforce immutability |

## B) Core GL (GL-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| GL-01 | COA hierarchy | ✅ | `coa-hierarchy.ts` — tree validation, cycle detection, subtree rollups, ancestors |
| GL-02 | Journal entry creation | ✅ | `createJournal` service + `create-journal.test.ts`, validates required fields |
| GL-03 | Double-entry balancing | ✅ | `journal-balance.ts` calculator, sum(debits)==sum(credits) enforced at post time |
| GL-04 | Minimum double-entry structure | ✅ | `createJournal` validates ≥2 lines, `journal-balance.ts` rejects single-line |
| GL-05 | Posting workflow | ✅ | `postJournal` — atomic status transition + balance upsert + audit + outbox, idempotent, `post-journal.test.ts` |
| GL-06 | Reversal | ✅ | `reverseJournal` — creates mirror journal, links original↔reversal, reason required, `reverse-journal.test.ts` |
| GL-07 | Void / cancel | ✅ | `voidJournal` — DRAFT-only, reason required, `void-journal.test.ts` |
| GL-08 | Trial balance | ✅ | `getTrialBalance` service + `trial-balance.ts` calculator, `get-trial-balance.test.ts` |
| GL-09 | Account classification | ✅ | `report-classifier.ts` — maps accounts to statement categories by `account.type`, versioned rule sets via `IClassificationRuleRepo` |
| GL-10 | Period close controls | ✅ | `closePeriod` (rejects if DRAFT journals remain), `lockPeriod`, `reopenPeriod` (CLOSED only, not LOCKED), `close-checklist.ts` sequencing |
| GL-11 | Budget baseline + variance | ✅ | `IBudgetRepo` + `getBudgetVariance` service + `variance-alerts.ts` calculator, budget routes, `get-budget-variance.test.ts` |
| GL-12 | Audit-grade lifecycle trail | ✅ | `IJournalAuditRepo` — full lifecycle timeline per journal (created→posted→reversed/voided), correlation IDs via outbox |

## C) Foreign Exchange (FX-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| FX-01 | Multi-currency line support | ✅ | `currencyCode` + `baseCurrencyDebit/Credit` on `gl_journal_line`, `fx-convert.ts` deterministic conversion |
| FX-02 | Rate sourcing & effective dating | ✅ | `IFxRateRepo.findRate(from, to, effectiveDate)`, `fx-rate-routes.ts`, `fx-rate-approval-routes.ts` + approval workflow |
| FX-03 | Triangulation / cross rates | ✅ | `fx-triangulation.ts` — `triangulateRate()` with path tracing (A→X→B), `auditRateSources()` |
| FX-04 | Revaluation & unrealized gain/loss | ✅ | `fx-revaluation.ts` — `computeRevaluation()` calculator, position-based, `computeGainLoss()` |
| FX-05 | Translation & CTA | ✅ | `fx-translation.ts` — `translateTrialBalance()` with CTA computation, IAS 21 compliant |

## D) Intercompany (IC-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| IC-01 | Agreement governance | ✅ | `IIcAgreementRepo`, `ic-agreement-routes.ts`, agreement status check in `createIcTransaction` |
| IC-02 | Paired entries (mirror journals) | ✅ | `createIcTransaction` service — creates source+mirror journals with trace linkage, `create-ic-transaction.test.ts` |
| IC-03 | Elimination readiness | ✅ | `ic-elimination.ts` — `computeEliminations()` calculator, tags IC postings for elimination |
| IC-04 | Settlement tracking | ✅ | `settleIcDocuments` service + `settle-ic-documents.test.ts` (7 tests), `settlement-routes.ts`, `IIcSettlementRepo` (create/confirm/cancel), `ic-aging.ts` open-items aging |

## E) Accounting Hub (AH-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| AH-01 | Derivation rules | ✅ | `derivation-engine.ts` — `derivePostings()`, rule-versioned, deterministic |
| AH-02 | Allocation engine | ✅ | `derivation-engine.ts` — `allocateByDriver()`, largest-remainder, sums preserved |
| AH-03 | Accrual engine | ✅ | `accrual-engine.ts` — `computeAccruals()`, straight-line/milestone/usage-based |
| AH-04 | Revenue recognition schedules | ✅ | `recognizeRevenue` service orchestrates: contract → schedule → journal creation → update recognizedToDate → outbox event. `revenue-recognition.ts` calculator (straight-line + milestone), `deferred-revenue.ts` roll-forward, `revenue-routes.ts` (5 endpoints incl. POST recognize), `recognize-revenue.test.ts` (11 tests) |

## D-bis) Recurring & Automated Entries (RE-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| RE-01 | Recurring journal templates | ✅ | `IRecurringTemplateRepo`, `recurring-template-routes.ts`, template CRUD with frequency/effective dating |
| RE-02 | Idempotent batch execution | ✅ | `processRecurringJournals` service — (template, period) idempotency key, `process-recurring-journals.test.ts` |
| RE-03 | Recurring schedule audit trail | ✅ | Each generated journal links to template + run, outbox event emitted, audit logged |

## E-bis) Financial Reporting (FR-xx)

| ID | Benchmark Item | Status | Evidence |
|----|---------------|--------|----------|
| FR-01 | Balance Sheet | ✅ | `getBalanceSheet` service + `classifyBalanceSheet`, `report-routes.ts`, `get-balance-sheet.test.ts` |
| FR-02 | Income Statement | ✅ | `getIncomeStatement` service + `classifyIncomeStatement`, `report-routes.ts`, `get-income-statement.test.ts` |
| FR-03 | Cash Flow Statement | ✅ | `getCashFlow` service + `classifyCashFlow`, `cash-flow-indirect.ts` derivation, `get-cash-flow.test.ts` |
| FR-04 | Report parameterization & scoping | ✅ | All report routes require `ledgerId` + `periodId` params, 400 on missing, tenant-scoped via `withTenant()` |
| FR-05 | Comparative period support | ✅ | `getComparativeBalanceSheet` + `getComparativeIncomeStatement` services return side-by-side current vs prior with per-account variance + variance%. `buildComparativeSection` pure calculator, `comparative-reports.test.ts` (7 tests), 2 new report routes |
| FR-06 | Budget variance reporting | ✅ | `getBudgetVariance` service + `variance-alerts.ts` calculator, `report-routes.ts` budget-variance-alerts endpoint |

---

## Summary

| Category | Total | ✅ | 🔧 | ⏳ |
|----------|-------|-----|-----|-----|
| A) Foundation Controls | 7 | 7 | 0 | 0 |
| B) Core GL | 12 | 12 | 0 | 0 |
| C) Foreign Exchange | 5 | 5 | 0 | 0 |
| D) Intercompany | 4 | 4 | 0 | 0 |
| E) Accounting Hub | 4 | 4 | 0 | 0 |
| D-bis) Recurring | 3 | 3 | 0 | 0 |
| E-bis) Financial Reporting | 6 | 6 | 0 | 0 |
| **Total** | **41** | **41** | **0** | **0** |

**Coverage: 41/41 (100%) fully implemented.**

---

## Closed Gaps (this session)

### GAP-1: AH-04 — Revenue Recognition Service ✅

**Implemented:** `recognizeRevenue` service in `app/services/recognize-revenue.ts`
- Reads contract → validates ACTIVE + not fully recognized
- Computes per-period amount via `computeStraightLineSchedule` calculator
- Caps at remaining amount to prevent over-recognition
- Creates recognition journal (debit deferred, credit revenue)
- Updates `recognizedToDate` on contract
- Emits `REVENUE_RECOGNIZED` outbox event
- Idempotent via `IIdempotencyStore`
- Route: `POST /revenue-contracts/:id/recognize`
- Tests: 11 in `recognize-revenue.test.ts`

### GAP-2: FR-05 — Comparative Period Support ✅

**Implemented:**
- `buildComparativeSection` pure calculator in `domain/calculators/comparative-report.ts`
- `getComparativeBalanceSheet` service — side-by-side assets/liabilities/equity with variance
- `getComparativeIncomeStatement` service — side-by-side revenue/expenses with net income variance
- Domain types: `ComparativeBalanceSheet`, `ComparativeIncomeStatement`, `ComparativeReportSection`, `ComparativeReportRow`
- Routes: `GET /reports/comparative-balance-sheet`, `GET /reports/comparative-income-statement`
- Tests: 7 in `comparative-reports.test.ts` (5 calculator + 2 service)

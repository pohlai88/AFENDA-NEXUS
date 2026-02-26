---
package: "@afenda/finance"
root_dir: "packages/modules/finance"
type: library
layer: module
composite: true
slice_isolation: true
entrypoints: ["src/public.ts", "src/infra.ts"]
public_api: "src/public.ts"
exports_map:
  ".": { source: "./src/public.ts", import: "./dist/public.js", types: "./dist/public.d.ts", default: "./src/public.ts" }
  "./infra": { source: "./src/infra.ts", import: "./dist/infra.js", types: "./dist/infra.d.ts", default: "./src/infra.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/contracts", "@afenda/authz", "@afenda/db", "@afenda/platform", "drizzle-orm", "fastify", "zod"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript", "vitest", "fast-check"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/public.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src/app", "src/app/ports", "src/shared", "src/slices"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/contracts", "@afenda/authz", "@afenda/db", "@afenda/platform"]
  forbidden_imports: ["fastify", "drizzle-orm", "postgres"]
  allow_imports_by_path:
    "src/slices/*/routes/**": ["fastify"]
    "src/slices/*/repos/**": ["drizzle-orm", "@afenda/db", "postgres"]
    "src/shared/routes/**": ["fastify"]
    "src/shared/repos/**": ["drizzle-orm", "@afenda/db", "postgres"]
    "src/slices/*/routes/**": ["fastify"]
    "src/slices/*/repos/**": ["drizzle-orm", "@afenda/db", "postgres"]
    "src/shared/routes/**": ["fastify"]
    "src/shared/repos/**": ["drizzle-orm", "@afenda/db", "postgres"]
  forbid_cross_layer_imports:
    - { from: "src/domain/**", forbid: ["src/app/**", "src/infra/**"] }
    - { from: "src/app/**", forbid: ["src/infra/**"] }
---

# @afenda/finance

## Purpose
General Ledger module (P0). Double-entry journal posting, chart of accounts, fiscal periods.

## Layer Rules
- **domain/** — Pure business rules. No DB, no HTTP, no framework imports.
- **app/** — Use-cases and ports (interfaces). Imports domain only.
- **infra/** — Adapters. Repositories use drizzle-orm; routes use fastify.
- **public.ts** — Domain types, ports, and services (no drizzle-orm/fastify deps).
- **infra.ts** — Drizzle repos, Fastify route registrars, runtime (OBS-01 subpath split).

## Exports
- `Journal`, `JournalLine`, `Account`, `AccountType`, `NormalBalance`, `FiscalPeriod`, `PeriodStatus` — core domain entities
- `Ledger` — ledger with base currency + fiscal year start
- `FxRate`, `convertAmount()` — FX rates + currency conversion
- `GlBalance`, `TrialBalanceRow`, `TrialBalance` — trial balance + GL balances
- `IntercompanyRelationship`, `IntercompanyDocument` — intercompany primitives
- `FinanceContext`, `FinanceActor`, `createFinanceContext()` — multi-tenant, multi-company context
- `postJournal()`, `createJournal()`, `getJournal()`, `reverseJournal()`, `voidJournal()` — journal services
- `getTrialBalance()`, `closePeriod()` — reporting + period management
- `IJournalRepo`, `IAccountRepo`, `IFiscalPeriodRepo`, `IGlBalanceRepo`, `IIdempotencyStore`, `IOutboxWriter` — port interfaces
- `FinanceRuntime`, `FinanceDeps` — composition root contract
- `DrizzleJournalRepo`, `DrizzleAccountRepo`, `DrizzlePeriodRepo`, `DrizzleBalanceRepo`, `DrizzleIdempotencyStore`, `DrizzleOutboxWriter` — infra adapters
- `createFinanceRuntime()` — wires all repos into FinanceRuntime
- `registerJournalRoutes()`, `registerAccountRoutes()`, `registerPeriodRoutes()`, `registerBalanceRoutes()`, `registerConsolidationRoutes()` — Fastify route registration
- `mapErrorToStatus()` — AppError → HTTP status mapping
- `IAuthorizationPolicy`, `FinancePermission`, `SoDViolation` — authorization port (GAP-06)
- `IDocumentNumberGenerator` — audit-grade document numbering port (GAP-02)
- `requirePermission()`, `requireSoD()` — authorization preHandler guards (GAP-06)
- `registerRateLimitGuard()` — per-tenant rate limiting preHandler (GAP-15)
- `RbacAuthorizationPolicy` — production RBAC policy using `@afenda/authz` `can()` evaluator (GAP-A1)
- `DefaultAuthorizationPolicy` — permissive stub for unit test mocks only (NOT used in runtime)
- `IRoleResolver`, `ISoDActionLogRepo` — authorization infrastructure ports
- `DrizzleRoleResolver`, `DrizzleSoDActionLogRepo` — Drizzle implementations
- `PERMISSION_MAP` — locked FinancePermission → authz resource×action mapping (16 entries)
- `FINANCE_SOD_RULES` — 4 SoD conflict rules (journal create↔post, post↔reverse, period close↔reopen, budget write↔journal post)
- `createAuthorizationPolicy()` — top-level factory for route-level RBAC enforcement

## Pure Calculators (`src/domain/calculators/`)
All calculators are side-effect-free functions returning `CalculatorResult<T>` with audit trail.

| File | Functions | Domain Reference |
|------|-----------|-----------------|
| `journal-balance.ts` | `validateJournalBalance` | DE-01 double-entry enforcement |
| `trial-balance.ts` | `computeTrialBalance`, `classifyByAccountType` | GL trial balance |
| `fx-convert.ts` | `convertAmountPrecise`, `computeGainLoss` | BigInt fixed-point FX |
| `report-classifier.ts` | `classifyBalanceSheet`, `classifyIncomeStatement`, `classifyCashFlow` | IAS 1/7 reports |
| `coa-hierarchy.ts` | `validateCoaIntegrity`, `getSubtree`, `getAncestors` | GL-01 CoA hierarchy |
| `segment-dimension.ts` | `validateDimensions` | GL-09 multi-dimensional coding |
| `ic-elimination.ts` | `computeEliminations` | CONSOL-01 IC elimination |
| `fx-translation.ts` | `translateTrialBalance` | IAS 21 FX translation |
| `close-checklist.ts` | `resolveCloseReadiness`, `sequenceMultiCompanyClose` | FC-01 financial close |
| `fx-revaluation.ts` | `computeRevaluation` | FX-06 unrealized gain/loss |
| `derivation-engine.ts` | `derivePostings`, `allocateByDriver` | AH-01 accounting hub |
| `cash-flow-indirect.ts` | `deriveCashFlowIndirect` | CF-01 / IAS 7 indirect method |
| `fx-triangulation.ts` | `triangulateRate`, `auditRateSources` | FX-03 triangulation, FX-04 rate audit |
| `accrual-engine.ts` | `computeAccruals` | AH-02 / IFRS 15 / IAS 37 accruals |

## Multi-Currency (IAS 21)
- `JournalLine.currencyCode` — transaction currency per line
- `JournalLine.baseCurrencyDebit/Credit` — functional currency equivalents
- DB migration `0008_journal_line_multicurrency.sql` adds columns + backfill
- Mapper reads `currencyCode` from DB (replaces hardcoded `"USD"`)

## FinanceContext Threading
All 15 services accept optional `ctx?: FinanceContext` as 3rd parameter.
When provided: `ctx.tenantId` overrides `input.tenantId`, `ctx.actor.userId` overrides `input.userId`,
`ctx.companyId` scopes account/period lookups.

## CI Gates
- **CIG-02**: ESLint `no-restricted-syntax` rule bans `Number()*rate`, `parseFloat()*rate`, `Math.round(x*rate)` in finance code. Float-to-BigInt bridge points have explicit `eslint-disable` with justification.
- **CIG-03**: ESLint `no-restricted-syntax` rule bans `req.query as Record<...>`, `req.query as {...}`, `req.params as {...}` type casts in route handlers. All input must go through Zod `.parse()`.
- **CIG-04**: ESLint `no-restricted-imports` in `@afenda/eslint-config` bans direct `@afenda/db`, `drizzle-orm`, `drizzle-kit` imports from route/handler/page files. DB access must go through composition roots (e.g. `createFinanceRuntime`).
- **CIG-05**: `rbac-guard-gate.test.ts` — scans all 42 route files: (a) every write route has `requirePermission`, (b) every route file accepts `IAuthorizationPolicy`, (c) SoD-relevant routes (journal post/reverse, period close/reopen) have `requireSoD`.
- **E13**: Circular dependency detection (global DFS across `@afenda/*` deps).
- **E14**: Public API surface stability — verifies `public.ts` has exports.
- **E15**: Port-implementation parity — every `I*Repo`/`I*Store`/`I*Writer`/`I*Generator`/`I*Policy` port has a Drizzle implementation in `infra/`.

## GAP-A1: Authorization & SoD (CLOSED)
- **RBAC**: All 42 route files enforce `requirePermission(policy, '<perm>')` via Fastify preHandler. No dev fallback.
- **SoD**: 4 SoD-relevant routes also enforce `requireSoD(policy, '<perm>', '<entityType>')`. Evidence logged transactionally in 10 services.
- **Single evaluator**: `@afenda/authz` `can()` is the sole RBAC decision point. `PERMISSION_MAP` is the sole FinancePermission→authz translation.
- **DB**: `erp.sod_action_log` table with RLS, indexed by `(tenant_id, entity_type, entity_id)`.
- **Wiring**: `apps/api/src/index.ts` creates `createAuthorizationPolicy(session)` and passes it to all 42 registrars.
- **admin:all**: Maps to `settings:update` (only owner/admin roles have this permission). No wildcard `*` resource.

## AIS Benchmark
See `AIS-BENCHMARK.md` — 48 capabilities tracked, 46/48 (96%) implemented.
Automated: `pnpm audit:ais` checks 41 items with evidence levels (L1-L5), `pnpm audit:sox` checks 12 SOX ITGC controls.

## Property-Based Invariant Tests
- **Tier A (pure)**: 12 tests via `fast-check` — GL-01 balanced posting, GL-02 minimum structure, FX-01 deterministic conversion, FX-02 rounding tolerance
- **Tier B (DB-backed)**: 5 tests — GL-03 trial balance integrity, GL-04 reversal nets to zero, INF-01 idempotency replay, INF-02 posted immutability
- Run: `pnpm test:property` (200 cases default, `PROPERTY_NUM_RUNS` env for nightly)

## Test Coverage
- 35+ test files, 330 unit tests passing, 29 integration/isolation tests (skipped without DATABASE_URL)
- 17 property-based invariant tests (12 pure + 5 DB-backed)
- 108 calculator tests across 5 test files (P1: 26, P2: 18, P3: 21, P4: 17, P5: 26)
- 6 posting-atomicity fault-injection tests (GAP-01)
- 50 HTTP route tests
- Coverage thresholds: lines 80%, functions 80%, branches 75%, statements 80%
- Coverage includes domain, app, AND infra layers (OBS-03)


# Finance Module — Full-Stack Audit & Enterprise Roadmap

> Last updated: 2026-02-28

---

## North Star — Observable Shape for Every Finance Sub-Domain

Every finance sub-domain **must** converge to this shape. If a domain
can't meet it yet, it is explicitly marked **"Preview / Read-only"**
(never accidentally incomplete).

| Layer | Required shape |
|---|---|
| **Routes** | List page, Detail `[id]/`, New `/new/`, Edit (drawer or route) — where applicable |
| **Feature folder** | `queries/` → `actions/` → `blocks/` → `forms/` → `schemas/` (if custom Zod) |
| **page.tsx** | Thin RSC composer, **< 80 LOC** (fetches + composes blocks, nothing else) |
| **Blocks** | Summary cards + main data table + empty state + filters (period + status minimum) |
| **Empty states** | Consistent ERP `EmptyState` with CTA into `/new` |
| **Filters** | Period / date-range, company / entity, currency, status — saved views (named) |
| **Export** | At least CSV on every list & report page |
| **Drill-down** | Every report number clickable → journal → source document → posting lines → audit trail |
| **Posting preview** | Any GL-posting action shows "preview entries" + "will post X lines to ledger Y" |
| **Idempotency UX** | Safe retries — "already posted" message, never duplicate postings |
| **Auditability** | Activity / Audit panel on detail pages (Created/Updated + by whom) |
| **SoD** | Destructive / high-risk actions gated via `@afenda/authz` policies |

---

## Inventory Snapshot

| Dimension | Count | Notes |
|---|---|---|
| Route files (`(shell)/finance/` + `(supplier-portal)/portal/`) | ~200 | 162 finance + 38 portal |
| Feature files (`features/finance/` + `features/portal/`) | ~220 | ~195 finance + ~25 portal |
| DB tables (`erp.ts` + supporting schemas) | 70+ | All RLS, bigint money, uuidV7 PKs |
| Backend domain slices (`packages/modules/finance/`) | 25 | 717+ source files, 55+ test files |
| Shared ERP components (`components/erp/`) | 46 | Shell, data display, page primitives, reports, documents |
| Route registrars (`public.ts`) | 24 (confirmed 32 in barrel) | Fastify plugins injected at boot |
| Reports | 13 sub-routes | **6 real, 7 hardcoded stubs** |

### Known defects (quantified)

| Defect class | Count | Risk |
|---|---|---|
| **Stub reports** (setTimeout + mock data) | 7 | **Critical** — user-visible lies |
| **Empty / hollow route scaffolds** | 9 dirs | **High** — dead-end navigation |
| **Hollow feature directory** (`credit-management/`) | 1 | **Medium** — confuses with real `credit/` |
| **Orphan component** (`kpi-cards.tsx`) | 1 | Low — dead file |
| **Inline pages > 80 LOC** (violating blocks pattern) | 6 domains | **Medium** — maintenance risk |
| **Actions exist, no form UI** | 13 sub-domains | **High** — backend capability not exposed |
| **DB tables with no UI** | 19 tables | Mixed — 5 need UI, 14 internal-only |
| **API routes with no frontend** | 4 registrars | **High** — dunning, supplier MDM, AP reporting |
| **ERP components missing from barrel** | 7 files | Low — used via relative imports |

---

## Phase 1 — CI-Enforced Truth Report (`FIN-UI-01` Gate)

**Goal:** Turn the inventory into a CI gate that prevents regressions and enforces the North Star.

### 1.1 Build `finance-audit.ts` in `tools/audit/`

The script must output:

1. **Route → Feature binding** — every `/finance/**` route maps to exactly one feature folder (or is explicitly `standalone`)
2. **Feature completeness score** per sub-domain:
   - `complete` — queries + actions + blocks + forms + detail route
   - `read_only` — queries + blocks only (explicitly opted-in)
   - `stub` — empty or scaffolding only (**forbidden in CI**)
3. **Forbidden-state violations** (any of these = PR fails):
   - `page.tsx` > 80 lines unless allow-listed
   - Empty `blocks/` or empty `actions/` directories
   - `/finance/**` route returning placeholder / stub data (`setTimeout`, hardcoded arrays)
   - Hollow feature directories (all subdirs empty)
4. **DB table coverage map** — table referenced by finance module but has no UI route (advisory, not blocking)
5. **Route-registrar ↔ page cross-ref** — API route with no matching frontend (advisory)

Output: `finance-audit-report.json` + `FINANCE-TRUTH-MAP.md` (auto-generated, never hand-edited).

### 1.2 Wire into CI

- Add `"audit:finance"` task in `turbo.json`
- Run via `pnpm audit:finance` on every PR
- Gate name: **`FIN-UI-01`** — fail PR if any forbidden state appears
- Advisory warnings (DB coverage, route registrar gaps) logged but non-blocking

---

## Phase 2 — Remove Lies & Landmines

This is where finance products die: users click around and hit dead ends,
or reports show convincing-looking numbers that are entirely fake.

### 2A — Stub Reports → Real Queries (highest urgency)

**Rule:** A report page is not allowed to ship unless it has:
- Real query (no `setTimeout`, no hardcoded arrays)
- Filter controls (period + entity minimum)
- Export (CSV minimum)
- Empty state ("No postings in selected period")

| # | Report | Current state | Required backend | Priority |
|---|---|---|---|---|
| 2A.1 | `reports/ap-aging/page.tsx` | `setTimeout` + mock data | `getApAging` — `registerApAgingRoutes` exists | **P0** |
| 2A.2 | `reports/ar-aging/page.tsx` | `setTimeout` + mock data | `getArAging` — `registerArAgingRoutes` exists | **P0** |
| 2A.3 | `reports/tax-summary/page.tsx` | `setTimeout` + mock data | Needs query in `tax.queries.ts` | **P0** |
| 2A.4 | `reports/asset-register/page.tsx` | `setTimeout` + mock data | Needs query in `fixed-assets.queries.ts` | **P1** |
| 2A.5 | `reports/consolidation/page.tsx` | `setTimeout` + mock data | Needs query in `consolidation.queries.ts` | **P1** |
| 2A.6 | `reports/cost-allocation/page.tsx` | `setTimeout` + mock data | Needs query in `cost-accounting.queries.ts` | **P1** |
| 2A.7 | `reports/equity-statement/page.tsx` | `setTimeout` + mock data | Needs new report query | **P2** |

**Note:** AP-aging and AR-aging backends already exist (`registerApAgingRoutes`, `registerArAgingRoutes`).
Check `packages/modules/finance/src/ap/` and `packages/modules/finance/src/ar/` for existing aging services —
the frontend queries just need wiring.

### 2B — Empty Routes & Hollow Dirs → Delete or Feature-Flag

If a route exists in navigation but has no content, it harms trust.

**Pick one per route:**
- **Delete** the route (preferable for truly empty scaffolds)
- **Feature-flag** it off so it's invisible in nav
- **Read-only preview** with real data + no create/edit buttons (if data exists)

| # | Action | Target | Decision |
|---|---|---|---|
| 2B.1 | **Delete hollow `credit-management/` feature** — all 3 subdirs empty, never imported, confuses with real `credit/` | `features/finance/credit-management/` | Delete |
| 2B.2 | **Delete orphan `kpi-cards.tsx`** — never imported anywhere | `features/finance/dashboard/blocks/kpi-cards.tsx` | Delete |
| 2B.3 | **Delete empty `blocks/` dirs** in `instruments/` and `provisions/` | `features/finance/{instruments,provisions}/blocks/` | Delete (recreated properly in Phase 4) |
| 2B.4 | **Delete or flag empty route scaffolds** | `treasury/{covenants,forecasts,loans}/`, `cost-centers/{allocations/new,drivers,[id]}/`, `credit/{holds,reviews,[id]}/` | Delete if truly empty; recreate properly in Phase 5 |
| 2B.5 | **Audit barrel exports** — classify 7 missing components as either barrel-exported or documented internal-only | `components/erp/index.ts` | Annotate with `/** @internal */` or add to barrel |

---

## Phase 3 — Inline Page Extraction (Architectural Consistency)

**Goal:** Refactor 6 domains with 164–188 LOC inline pages into the standard blocks pattern.

**Enforced rule:**
- `page.tsx` = fetch + layout + compose blocks (< 80 LOC)
- Blocks = small, testable client components
- Tables / cards live in `blocks/`
- Server actions live in `actions/`

| # | Domain | Current LOC | Extract to `blocks/` |
|---|---|---|---|
| 3.1 | **consolidation** | 172 | `consolidation-summary-cards.tsx`, `group-entity-table.tsx`, `goodwill-table.tsx` |
| 3.2 | **hedging** | 175 | `hedge-summary-cards.tsx`, `hedge-relationships-table.tsx`, `effectiveness-tests-table.tsx` |
| 3.3 | **deferred-tax** | 188 | `deferred-tax-summary-cards.tsx`, `deferred-tax-items-table.tsx` |
| 3.4 | **instruments** | 171 | `instruments-table.tsx`, `instrument-summary-cards.tsx` |
| 3.5 | **provisions** | 168 | `provisions-table.tsx`, `provision-summary-cards.tsx` |
| 3.6 | **transfer-pricing** | 164 | `tp-policies-table.tsx`, `tp-summary-cards.tsx` |

**Reference pattern:** `features/finance/treasury/blocks/` — each block is a focused client component, `page.tsx` becomes a thin RSC that composes them.

---

## Phase 4 — Close "Actions Exist But No UI" (Backend → User Capability)

**Goal:** Convert the 13 sub-domains with create/update server actions but no form pages into full CRUD flows.

**UX rule:** Don't build `/new` pages that dump 40 fields. Use **wizards** for enterprise flows:
`create → validate → confirm → post/commit` — show "posting preview" where relevant.

### Tier 1 — High value + frequency

| # | Domain | Missing routes | Actions to wire | UX pattern |
|---|---|---|---|---|
| 4.1 | **cost-centers** | `/new/`, `/[id]/` | `createCostCenter`, `updateCostCenter`, driver CRUD | Tree + inline edit |
| 4.2 | **credit** | `/new/`, `/[id]/` | `setCreditLimit`, `createCreditReview`, `placeHold`/`releaseHold` | Detail tabs + action buttons |
| 4.3 | **provisions** | `/new/`, `/[id]/` | `createProvision`, `recordMovement`, `reverseProvision` | Form + movement timeline |
| 4.4 | **instruments** | `/new/`, `/[id]/` | `createInstrument`, `recordFairValue`, `disposeInstrument` | Wizard (classify → measure → confirm) |
| 4.5 | **deferred-tax** | `/new/`, `/[id]/` | `createDeferredTaxItem`, `recalculateDeferredTax` | Form + schedule preview |

### Tier 2 — Compliance-critical (IFRS/IAS)

| # | Domain | Missing routes | Actions | UX pattern |
|---|---|---|---|---|
| 4.6 | **consolidation** | `/new/`, `/[id]/` | `addGroupEntity`, `runConsolidation`, `recordImpairment` | Wizard (select entities → run → review eliminations → post) |
| 4.7 | **hedging** | `/new/`, `/[id]/` | `designateHedgeRelationship`, `runEffectivenessTest`, `discontinueHedge` | Wizard (designate → test → review OCI impact) |
| 4.8 | **transfer-pricing** | `/new/`, `/[id]/` | `createTransferPricingPolicy`, `uploadBenchmarkStudy` | Form + document upload |
| 4.9 | **treasury** | `covenants/new/`, `forecasts/new/`, `loans/new/` | `createCashForecast`, `createCovenant`, `createICLoan` | Tab-based sub-domain forms |

### Tier 3 — Nice to have

| # | Domain | Missing routes | Notes |
|---|---|---|---|
| 4.10 | **budgets** | Entire `/finance/budgets/` route | Currently consumed only via budget-variance report |

---

## Phase 5 — DB Tables Without UI (Settings vs Operational vs Internal)

**Goal:** Correctly classify the 19 uncovered DB tables and build UI where needed.

### 5A — Settings UI (admin/config — controls behavior)

These must exist because they control runtime behavior across the system:

| Table | UI location | Rationale |
|---|---|---|
| `payment_terms_template`, `payment_terms_line` | `/finance/settings/payment-terms/` | Referenced during every invoice creation |
| `expense_policy` | `/finance/expenses/policies/` | Backend has `DrizzleExpensePolicyRepo`, controls claim validation |
| `match_tolerance` | `/finance/settings/matching/` | Controls AP auto-matching thresholds |

### 5B — Operational UI (money-moving workflows)

| Table | UI location | Rationale |
|---|---|---|
| `dunning_run`, `dunning_letter` | `/finance/receivables/dunning/` | Full backend service + API route (`registerArDunningRoutes`) with zero frontend |
| `ap_prepayment`, `ap_prepayment_application` | `/finance/payables/prepayments/` | Core AP functionality, prepayment lifecycle |
| `revenue_contract`, `recognition_milestone` | `/finance/revenue-recognition/` (new sub-domain) | IFRS 15 compliance — revenue recognition is audit-critical |

### 5C — Internal-only (no UI required — consumed by calculators/services)

| Table | Rationale |
|---|---|
| `classification_rule_set`, `classification_rule` | Accounting Hub derivation engine — configured at deploy time |
| `mapping_rule`, `mapping_rule_version` | Mapping engine internals |
| `accounting_event` | Event sourcing table — consumed by services only |
| `asset_component` | Sub-entity of `asset` — consumed by fixed-assets calculators |
| `fair_value_measurement` | Sub-entity of `financial_instrument` — consumed by fin-instruments service |
| `hedge_effectiveness_test` | Sub-entity of `hedge_relationship` — consumed by hedge service |
| `tp_benchmark` | Sub-entity of `tp_policy` — consumed by transfer-pricing service |

**Even internal-only tables should ideally have:**
- Admin read-only inspector (optional, low priority)
- Audit logs (already covered by `sod_action_log`)
- A "where used" link for enterprise debugging

---

## Phase 6 — Missing API-to-UI Wiring

| API route registrar | Needed UI | Priority |
|---|---|---|
| `registerArDunningRoutes` | New `/finance/receivables/dunning/` — list + detail + run-wizard | **P0** (full backend, zero frontend) |
| `registerSupplierMdmRoutes` | Enhance `/finance/payables/suppliers/[id]/` with MDM tabs (bank accounts, documents, compliance, contacts, tax registrations) | **P1** |
| `registerApReportingRoutes` | Wire into existing AP pages or create `/finance/reports/ap-overview/` | **P2** |
| `registerSupplierPortalRoutes` | Verify if `(supplier-portal)/portal/` already covers this — likely yes | **P2** (validate only) |

---

## Phase 7 — The 3 "Silent Killers" (Cross-Cutting UX)

These are the things that make a finance module feel cheap even when features exist.
Address progressively across all sub-domains.

### 7.1 Filters + Saved Views Everywhere

Every list page and report must support:
- Date range / fiscal period
- Company / entity
- Currency
- Status (draft / posted / void / etc.)
- **Saved filters** (named, per-user, shareable)

### 7.2 Document Drill-Down

From every report number, the user must be able to click through:
`Report row → Journal → Source document → Posting lines → Audit trail`

This requires consistent `documentId` / `journalId` linking across all sub-domains.

### 7.3 Posting Preview + Idempotency UX

Any action that posts to GL must show:
- **Preview entries** before commit
- **"Will post X lines to ledger Y"** confirmation
- **Safe retries** — "already posted" message, never a duplicate posting
- Leverages existing `tamper-resistant-outbox` + `drizzle-idempotency` infrastructure

---

## Definition of Done — Per Sub-Domain Checklist

Use this checklist to verify each sub-domain before marking it `complete`.
This is also the generator output checklist for new domains.

- [ ] Has `/finance/<domain>/page.tsx` list view
- [ ] Has `/new` + `/[id]` (or explicitly declared read-only with justification)
- [ ] `page.tsx` < 80 LOC (blocks extracted)
- [ ] Blocks: summary cards + main table + empty state
- [ ] Filters: period + status at minimum
- [ ] At least 1 export: CSV
- [ ] SoD gates on post / approve / delete actions
- [ ] Audit panel on detail page (or audit log link)
- [ ] No stub / mock data anywhere in the route tree
- [ ] Tests: at least route render + action validation
- [ ] Drill-down: clickable references to journals / source documents

---

## If You Only Do 5 Things (Best ROI, In Order)

| # | Move | Why |
|---|---|---|
| 1 | **Implement `audit:finance` + `FIN-UI-01` gate** | Stops regressions, makes truth visible, enforces North Star |
| 2 | **Replace 7 stub reports with real queries** | Restores user trust — fake data in financial reports is unacceptable |
| 3 | **Delete / feature-flag empty routes & hollow dirs** | Removes dead-end navigation that erodes confidence |
| 4 | **Extract 6 inline pages → blocks** | Unlocks scale, makes every new domain copy/paste of proven skeleton |
| 5 | **Ship 1 complete "gold slice"** (Cost Centers or Credit) | Proves the full pattern end-to-end and becomes the template for all remaining domains |

---

## Verification Checklist

1. **CI gate** — `pnpm audit:finance` passes with zero forbidden states on every PR
2. **TypeScript** — `pnpm tsc --noEmit` across workspace (already exists)
3. **Import graph** — `madge --circular apps/web/src/features/finance/` verifies no circular deps after refactoring
4. **Smoke test** — navigate every `/finance/*` route: no blank pages, no infinite loaders, no console errors
5. **E2E coverage** — check `apps/e2e/tests/` for finance test coverage; add tests for newly wired reports

---

## Design Decisions Log

| Decision | Rationale |
|---|---|
| **Lies before cleanup, cleanup before features** | Stub reports and empty routes damage user trust faster than missing features — fix trust first |
| **Blocks extraction over leave-inline** | 20 of 25 sub-domains already follow blocks pattern — consistency wins over convenience |
| **DB tables 3-tier split** (Settings / Operational / Internal) | Not all 19 uncovered tables need UI — internal tables are calculator plumbing, settings tables control behavior, operational tables are money-moving workflows |
| **Wizards over 40-field forms** | Enterprise finance flows need create → validate → confirm → post — not flat forms |
| **CI gate before any new feature work** | Without `FIN-UI-01`, every PR can reintroduce stub data or empty scaffolds — gate first, build second |
| **"Gold slice" as template** | One fully-complete sub-domain (Cost Centers or Credit) becomes the copy/paste skeleton for all remaining domains — proves the pattern before scaling it |
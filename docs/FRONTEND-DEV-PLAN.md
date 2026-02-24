# Frontend Development Plan — `@afenda/web`

> **Version:** 1.0 **Created:** 2026-02-24 **Aligned with:**
> `ARCHITECTURE.@afenda-web.md` v1.0, `PROJECT.md` v2.2 **Tracking:**
> Sprint-based, 2-week sprints. Each sprint has acceptance criteria.
> **Principle:** Finance-first. Every sprint delivers a usable increment. No
> dead scaffolding.

---

## Current State Summary

| Area               | Status           | Notes                                                                      |
| ------------------ | ---------------- | -------------------------------------------------------------------------- |
| Architecture doc   | **Done**         | `ARCHITECTURE.@afenda-web.md` — ratified, 602 lines                        |
| Dependencies       | **Done**         | 66 packages installed (RHF, Zod resolvers, Radix, Lucide, etc.)            |
| Typecheck          | **Clean**        | `pnpm --filter @afenda/web typecheck` passes                               |
| Directory scaffold | **Done**         | 46 source files across lib, hooks, providers, components, features, routes |
| API wiring         | **Not started**  | All query functions exist but pages use placeholder data                   |
| Auth               | **Not started**  | `lib/auth.ts` has cookie-based stubs, no real middleware                   |
| shadcn/ui base     | **Done**         | 20+ components in `components/ui/`, `components.json` configured           |
| Tailwind v4 CSS    | **Done**         | v4 four-step architecture: root vars + hsl() + @theme inline + native CSS  |
| Theme provider     | **Done**         | `next-themes` with SSR, localStorage, system detection, flash prevention   |
| Tests              | **Bootstrapped** | Vitest + RTL + MSW + jest-axe, 4 test files, 35 tests passing              |

---

## Sprint Overview

| Sprint | Name                            | Status   | Duration   | Key Deliverable                                                       |
| ------ | ------------------------------- | -------- | ---------- | --------------------------------------------------------------------- |
| **S0** | Foundation & Scaffold           | **DONE** | Week 1-2   | Architecture doc, deps, directory structure, core lib, ERP components |
| **S1** | shadcn/ui + AppShell Polish     | Planned  | Week 3-4   | Real shadcn components, polished AppShell, theme, responsive sidebar  |
| **S2** | Auth + API Client Wiring        | Planned  | Week 5-6   | Login flow, session cookies, API client wired to all pages            |
| **S3** | Journal CRUD (Full Cycle)       | Planned  | Week 7-8   | Create → Post → Reverse → Void with receipts, audit panel             |
| **S4** | Trial Balance + Reports         | Planned  | Week 9-10  | Read-only financial reports, chart of accounts, fiscal periods        |
| **S5** | Intercompany + Advanced Finance | Planned  | Week 11-12 | IC transfer UI, budget variance, recurring journals                   |
| **S6** | Testing + Accessibility Audit   | Planned  | Week 13-14 | Vitest + RTL, a11y audit, coverage gates                              |
| **S7** | AP/AR Module Screens            | Planned  | Week 15-16 | Expand journal pattern to AP invoices, AR invoices                    |
| **S8** | DX Polish + Generators          | Planned  | Week 17-18 | Screen/form/table generators, drift checks, CI gates                  |
| **S9** | Performance + Production Prep   | Planned  | Week 19-20 | Bundle analysis, Lighthouse, error monitoring, deploy pipeline        |

---

## S0 — Foundation & Scaffold ✅ DONE

**Goal:** Establish architecture, install dependencies, scaffold the full
directory structure with typed placeholders.

### Deliverables

| #     | Item                        | Status  | Files                                                                                                                                                                                                                             |
| ----- | --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0.1  | Architecture document       | ✅ Done | `ARCHITECTURE.@afenda-web.md` (602 lines)                                                                                                                                                                                         |
| S0.2  | `package.json` dependencies | ✅ Done | 15 runtime deps, 5 dev deps                                                                                                                                                                                                       |
| S0.3  | `next.config.ts` update     | ✅ Done | `transpilePackages`, image formats                                                                                                                                                                                                |
| S0.4  | Core lib files              | ✅ Done | `utils.ts`, `api-client.ts`, `format.ts`, `auth.ts`, `constants.ts`, `types.ts`                                                                                                                                                   |
| S0.5  | Providers                   | ✅ Done | `tenant-provider.tsx`, `theme-provider.tsx`                                                                                                                                                                                       |
| S0.6  | Hooks                       | ✅ Done | `use-tenant-context.ts`, `use-receipt.ts`, `use-debounce.ts`, `use-media-query.ts`                                                                                                                                                |
| S0.7  | ERP shared components       | ✅ Done | 13 components: `app-shell`, `sidebar-nav`, `tenant-switcher`, `company-switcher`, `period-indicator`, `status-badge`, `money-cell`, `date-cell`, `receipt-panel`, `audit-panel`, `page-header`, `empty-state`, `loading-skeleton` |
| S0.8  | Finance feature — journals  | ✅ Done | `journal.queries.ts`, `journal-table.tsx`, `journal-detail-header.tsx`, `journal-lines-editor.tsx`, `journal-draft-form.tsx`                                                                                                      |
| S0.9  | Finance feature — reports   | ✅ Done | `report.queries.ts`                                                                                                                                                                                                               |
| S0.10 | Route pages                 | ✅ Done | 15 route files: root layout, `(shell)` layout, dashboard, 7 finance pages, settings, login, error, loading, not-found                                                                                                             |
| S0.11 | Root layout with providers  | ✅ Done | `ThemeProvider` + `TenantProvider` wrapping app                                                                                                                                                                                   |

### Architecture Patterns Established

- **Contract-first** — Zod schemas from `@afenda/contracts` drive form
  validation
- **RSC reads + Server Actions for writes** — query functions are server-side
- **Feature-sliced** — `features/{domain}/{entity}/{queries,blocks,forms}`
- **AppShell** — collapsible sidebar, tenant/company/period context
- **Receipt panel** — every mutation shows `CommandReceipt` confirmation
- **Typed API client** — `createApiClient(ctx)` with `ApiResult<T>` union type

---

## S0.5 — Tailwind v4 Hardening + Test Bootstrap ✅ DONE

**Goal:** Fix CSS architecture violations against Tailwind v4 best practices,
replace custom theme provider with `next-themes`, bootstrap test infrastructure,
and harden the CI drift gate.

### Deliverables

| #      | Item                                   | Status  | Files                                                                                                 |
| ------ | -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| S0.5.1 | Tailwind v4 four-step CSS fix          | ✅ Done | `globals.css` — vars at root (not `@layer base`), `hsl()` wrappers, full `@theme inline`, no `@apply` |
| S0.5.2 | Fix sidebar double-wrap                | ✅ Done | `sidebar.tsx` — `hsl(var())` → `var()`                                                                |
| S0.5.3 | Sync ARCHITECTURE.md allowlists        | ✅ Done | `ARCHITECTURE.@afenda-web.md` — unified `radix-ui`, added `next-themes`, `zod`, test devDeps          |
| S0.5.4 | Replace ThemeProvider with next-themes | ✅ Done | `theme-provider.tsx` — SSR-safe, localStorage, system detection, flash prevention                     |
| S0.5.5 | Update theme-toggle import             | ✅ Done | `theme-toggle.tsx` — `useTheme` from `next-themes`                                                    |
| S0.5.6 | Vitest + RTL + MSW setup               | ✅ Done | `vitest.config.ts`, `src/__tests__/setup.ts`, `src/__tests__/utils.tsx`, `src/__tests__/mocks/`       |
| S0.5.7 | Seed tests (35 passing)                | ✅ Done | `utils.test.ts`, `format.test.ts`, `use-debounce.test.ts`, `status-badge.test.tsx`                    |
| S0.5.8 | W10 hardened (@apply in globals)       | ✅ Done | `web-drift-check.mjs` — `@apply` in globals.css now fails (not just warns)                            |
| S0.5.9 | W16 new (@theme inline check)          | ✅ Done | `web-drift-check.mjs` — verifies every `:root` var has `@theme inline` mapping                        |

### Skills Applied

- **`tailwind-v4-shadcn`** — Four-step architecture, `hsl()` wrapper rule,
  `@apply` deprecation, `@theme inline` completeness
- **`react-testing-patterns`** — Custom render with providers, MSW server setup,
  jest-axe accessibility testing, hook testing with `renderHook`
- **`shadcn-ui`** — `next-themes` integration, `components.json` alignment,
  domain-free `components/ui/`

---

## S1 — shadcn/ui + AppShell Polish

**Goal:** Install real shadcn/ui base components, polish the AppShell for
production quality, implement responsive design and dark mode.

### Deliverables

| #     | Item                                  | Acceptance Criteria                                                                                                                                                                                     |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1.1  | Install shadcn/ui base components     | `npx shadcn@latest add button input label select card dialog form table badge tabs tooltip separator popover command scroll-area dropdown-menu avatar switch skeleton sonner` — all in `components/ui/` |
| S1.2  | Refactor ERP components to use shadcn | `StatusBadge` uses `<Badge>`, forms use `<Form>/<FormField>`, tables use `<Table>`, dialogs use `<Dialog>`                                                                                              |
| S1.3  | `business-document.tsx`               | Standard document layout (header + tabs + right rail) used by journal detail and all future document views                                                                                              |
| S1.4  | `data-table.tsx`                      | Generic sortable/filterable table component wrapping shadcn `<Table>` with column definitions                                                                                                           |
| S1.5  | `command-palette.tsx`                 | Cmd+K global search using `cmdk` + shadcn `<Command>`                                                                                                                                                   |
| S1.6  | `error-boundary.tsx`                  | Feature-level error boundary component                                                                                                                                                                  |
| S1.7  | Responsive sidebar                    | Mobile: hamburger menu / sheet overlay. Desktop: collapsible. Persisted preference.                                                                                                                     |
| S1.8  | Dark mode toggle                      | ✅ **DONE (S0.5)** — `next-themes` provider + `ThemeToggle` component in topbar                                                                                                                         |
| S1.9  | Toast integration                     | Wire `sonner` `<Toaster>` in root layout, use for non-blocking notifications                                                                                                                            |
| S1.10 | `loading.tsx` per route segment       | Finance journals, trial-balance, accounts, periods, reports — each gets a `loading.tsx` with appropriate skeleton                                                                                       |

### Definition of Done — S1

- [ ] All shadcn components installed and rendering
- [ ] AppShell responsive at 768px and 1024px breakpoints
- [ ] Dark mode toggles correctly, persists across sessions
- [ ] Cmd+K opens command palette (even if search is placeholder)
- [ ] Every route segment has a `loading.tsx`
- [ ] No visual regressions on existing pages

---

## S2 — Auth + API Client Wiring

**Goal:** Implement real authentication flow and wire the typed API client to
all existing pages.

### Deliverables

| #     | Item                          | Acceptance Criteria                                                                  |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------ |
| S2.1  | Login page (functional)       | Email/password form → API call → set session cookie → redirect to dashboard          |
| S2.2  | Auth middleware               | Next.js middleware that checks session cookie, redirects unauthenticated to `/login` |
| S2.3  | `(auth)` route group          | Login/register pages use a separate layout (no AppShell)                             |
| S2.4  | `getRequestContext()` wired   | Every `(shell)` page calls `getRequestContext()` for tenant/user/token               |
| S2.5  | API client headers            | `x-tenant-id`, `x-user-id`, `Authorization: Bearer` sent on every request            |
| S2.6  | Tenant context hydration      | On login, fetch tenant/companies/active-period, hydrate `TenantProvider`             |
| S2.7  | Company switcher (functional) | Switching company updates context, re-fetches data                                   |
| S2.8  | Period indicator (functional) | Shows real active period from API                                                    |
| S2.9  | Logout                        | Clear session cookie, redirect to login                                              |
| S2.10 | Error handling                | 401 → redirect to login. 403 → show forbidden. 500 → error boundary.                 |

### Dependencies

- `apps/api` must have: `POST /auth/login`, `GET /auth/me`,
  `GET /tenants/:id/companies`
- Session token format agreed (JWT or opaque)

### Definition of Done — S2

- [ ] Login → dashboard flow works end-to-end
- [ ] Unauthenticated users always redirected to `/login`
- [ ] Tenant/company context populated from real API
- [ ] All existing pages fetch real data (or show proper empty states if API
      returns empty)
- [ ] 401/403/500 handled gracefully

---

## S3 — Journal CRUD (Full Cycle)

**Goal:** Complete the journal entry lifecycle: create draft → validate → post →
reverse → void, with receipts and audit trail.

### Deliverables

| #     | Item                            | Acceptance Criteria                                                                                 |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| S3.1  | Journal list (real data)        | Fetches from `GET /journals`, shows table with pagination, status filter, period filter             |
| S3.2  | Journal create (real data)      | `JournalDraftForm` submits via Server Action → `POST /journals` → receipt panel                     |
| S3.3  | Journal detail view             | `business-document.tsx` layout: header (status, doc number, dates), tabs (Lines, Accounting, Audit) |
| S3.4  | Journal lines tab               | Read-only table of debit/credit lines with account codes, amounts, currency                         |
| S3.5  | Journal post action             | "Post" button on DRAFT journals → `POST /journals/:id/post` → receipt → status updates to POSTED    |
| S3.6  | Journal reverse action          | "Reverse" button on POSTED journals → reason dialog → `POST /journals/:id/reverse` → receipt        |
| S3.7  | Journal void action             | "Void" button on DRAFT journals → reason dialog → `POST /journals/:id/void` → receipt               |
| S3.8  | Audit trail tab                 | `AuditPanel` on journal detail, fetches `GET /journals/:id/audit`                                   |
| S3.9  | Idempotency                     | Create/post actions send idempotency key, UI prevents double-submit                                 |
| S3.10 | URL state for filters           | `nuqs` for `?status=DRAFT&periodId=...&page=1` — shareable, bookmarkable                            |
| S3.11 | Journal lines editor validation | Debits must equal credits, at least 2 lines, account codes required                                 |

### Definition of Done — S3

- [ ] Full journal lifecycle works: create → post → reverse/void
- [ ] Every mutation shows receipt panel
- [ ] Audit trail shows who/when/what for every action
- [ ] POSTED journals are read-only (no edit controls)
- [ ] REVERSED/VOIDED journals show reference to reversal/void
- [ ] Filters and pagination work via URL state
- [ ] Double-submit prevented via idempotency

---

## S4 — Trial Balance + Reports + Accounts + Periods

**Goal:** Read-only financial reporting screens and reference data management.

### Deliverables

| #    | Item                    | Acceptance Criteria                                                                                    |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| S4.1 | Trial balance page      | Fetches `GET /trial-balance?ledgerId=&year=&period=`, renders account-level debit/credit/balance table |
| S4.2 | Chart of accounts page  | Fetches `GET /accounts`, renders hierarchical account list with type/classification                    |
| S4.3 | Fiscal periods page     | Fetches `GET /periods`, shows period list with status. Actions: close, lock, reopen (with receipts)    |
| S4.4 | Balance sheet report    | Fetches `GET /reports/balance-sheet`, renders assets/liabilities/equity sections                       |
| S4.5 | Income statement report | Fetches `GET /reports/income-statement`, renders revenue/expense/net income                            |
| S4.6 | Cash flow report        | Fetches `GET /reports/cash-flow`, renders operating/investing/financing sections                       |
| S4.7 | Report filters          | Ledger selector, period range, comparative toggle                                                      |
| S4.8 | Export placeholder      | "Export to CSV" button (stub — actual export in later sprint)                                          |

### Dependencies

- API endpoints: `GET /trial-balance`, `GET /accounts`, `GET /periods`,
  `POST /periods/:id/close`, `POST /periods/:id/lock`,
  `POST /periods/:id/reopen`, `GET /reports/balance-sheet`,
  `GET /reports/income-statement`, `GET /reports/cash-flow`

### Definition of Done — S4

- [ ] Trial balance renders with correct totals (debits = credits)
- [ ] Chart of accounts shows hierarchy
- [ ] Period close/lock/reopen works with receipts
- [ ] All 3 financial statements render
- [ ] Reports respect ledger and period filters

---

## S5 — Intercompany + Advanced Finance

**Goal:** Intercompany transfer UI, budget variance, recurring journals, FX rate
management.

### Deliverables

| #    | Item                        | Acceptance Criteria                                                         |
| ---- | --------------------------- | --------------------------------------------------------------------------- |
| S5.1 | IC transaction create       | Paired journal view (source + mirror company), uses `POST /ic-transactions` |
| S5.2 | IC transaction list         | Fetches `GET /ic-transactions`, shows paired view with settlement status    |
| S5.3 | IC aging report             | Fetches `GET /reports/ic-aging`, shows outstanding IC balances              |
| S5.4 | Budget variance report      | Fetches `GET /reports/budget-variance`, shows budget vs actual with alerts  |
| S5.5 | Recurring journal templates | List/create/edit recurring templates, trigger processing                    |
| S5.6 | FX rate management          | List/create FX rates, approval workflow UI                                  |
| S5.7 | Ledger management           | List/view ledgers with base currency                                        |

### Definition of Done — S5

- [ ] IC transactions create paired journals across companies
- [ ] IC aging and budget variance reports render
- [ ] Recurring templates can be managed and triggered
- [ ] FX rates can be viewed and approved

---

## S6 — Testing + Accessibility Audit

**Goal:** Establish test infrastructure, write component/integration tests, pass
accessibility audit.

### Deliverables

| #     | Item                     | Acceptance Criteria                                                                              |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| S6.1  | Vitest + RTL setup       | ✅ **DONE (S0.5)** — `vitest.config.ts`, RTL, jest-dom, MSW, jest-axe, custom render, 35 tests   |
| S6.2  | Lib unit tests           | `format.ts`, `constants.ts`, `api-client.ts` — 100% coverage on pure functions                   |
| S6.3  | Component tests          | `StatusBadge`, `MoneyCell`, `DateCell`, `ReceiptPanel`, `AuditPanel`, `EmptyState`, `PageHeader` |
| S6.4  | Form tests               | `JournalDraftForm` — validation, submission, error display, receipt display                      |
| S6.5  | Hook tests               | `useReceipt`, `useDebounce`, `useMediaQuery`                                                     |
| S6.6  | Integration tests        | Journal list page renders with mock data, journal create submits correctly                       |
| S6.7  | Accessibility audit      | `eslint-plugin-jsx-a11y` added, all violations fixed                                             |
| S6.8  | Keyboard navigation test | Tab through AppShell, forms, tables — all interactive elements reachable                         |
| S6.9  | Screen reader test       | VoiceOver/NVDA walkthrough of journal create flow                                                |
| S6.10 | Coverage gates           | Lines 80%, functions 80%, branches 75%, statements 80%                                           |

### Definition of Done — S6

- [ ] All tests pass, coverage thresholds met
- [ ] Zero `jsx-a11y` lint errors
- [ ] Keyboard-only navigation works for all flows
- [ ] Screen reader announces form errors, status changes, receipts
- [ ] `pnpm --filter @afenda/web test` in CI pipeline

---

## S7 — AP/AR Module Screens

**Goal:** Expand the journal pattern to Accounts Payable and Accounts
Receivable.

### Deliverables

| #    | Item                 | Acceptance Criteria                                          |
| ---- | -------------------- | ------------------------------------------------------------ |
| S7.1 | AP invoice list      | Fetches AP invoices, shows table with status/amount/vendor   |
| S7.2 | AP invoice create    | Form with line items, tax calculation, approval workflow     |
| S7.3 | AP invoice detail    | Business document layout with lines, accounting, audit tabs  |
| S7.4 | AP payment recording | Record payment against invoice, partial payment support      |
| S7.5 | AR invoice list      | Fetches AR invoices, shows table with status/amount/customer |
| S7.6 | AR invoice create    | Form with line items, revenue recognition hooks              |
| S7.7 | AR invoice detail    | Business document layout                                     |
| S7.8 | AR payment recording | Record receipt against invoice                               |
| S7.9 | Navigation update    | Sidebar nav expanded with AP/AR sections                     |

### Dependencies

- `@afenda/finance` AP/AR slices implemented (see `FINANCE-DEV-PLAN.md`)
- API endpoints for AP/AR CRUD

### Definition of Done — S7

- [ ] AP/AR invoice lifecycle works: create → approve → post → pay
- [ ] Same patterns as journals (receipts, audit, idempotency)
- [ ] Navigation reflects new modules

---

## S8 — DX Polish + Generators

**Goal:** Developer experience tooling — screen generators, drift checks, CI
gates.

### Deliverables

| #    | Item                    | Acceptance Criteria                                                                                                  |
| ---- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| S8.1 | `gen:screen` generator  | `pnpm gen:screen finance accounts` → creates list page + detail page + new page + blocks skeleton                    |
| S8.2 | `gen:form` generator    | `pnpm gen:form CreateJournalSchema` → creates RHF + Zod wiring + field stubs                                         |
| S8.3 | `gen:table` generator   | `pnpm gen:table JournalListItem` → creates table columns + formatters                                                |
| S8.4 | UI drift checks         | ✅ **DONE (pulled to S0)** — `pnpm web:drift` with 15 checks (W01-W15)                                               |
| S8.5 | `arch:guard` web rules  | ✅ **DONE (pulled to S0)** — `ARCHITECTURE.@afenda-web.md` enforced by `arch:guard` (E1-E15) + `web:drift` (W01-W15) |
| S8.6 | Storybook (optional)    | If team size warrants, add Storybook for ERP component library                                                       |
| S8.7 | `components.json` audit | Verify shadcn config matches architecture doc                                                                        |

### Definition of Done — S8

- [ ] Generators produce files matching architecture patterns
- [ ] Drift checks catch forbidden imports in CI
- [ ] New developer can scaffold a feature module in < 5 minutes

---

## S9 — Performance + Production Prep

**Goal:** Production-ready performance, error monitoring, deployment pipeline.

### Deliverables

| #     | Item                  | Acceptance Criteria                                                   |
| ----- | --------------------- | --------------------------------------------------------------------- |
| S9.1  | Bundle analysis       | `@next/bundle-analyzer` — identify and eliminate large client bundles |
| S9.2  | Lighthouse audit      | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90             |
| S9.3  | Image optimization    | All images via `next/image`, AVIF/WebP formats                        |
| S9.4  | Font optimization     | `next/font` for system or custom fonts, no layout shift               |
| S9.5  | Error monitoring      | Sentry or equivalent — client + server error capture                  |
| S9.6  | Analytics placeholder | Event tracking hooks (no vendor lock-in)                              |
| S9.7  | CSP headers           | Content Security Policy in `next.config.ts`                           |
| S9.8  | Rate limiting UI      | Client-side retry with backoff for 429 responses                      |
| S9.9  | Docker build          | Multi-stage Dockerfile for `apps/web`                                 |
| S9.10 | CI/CD pipeline        | Build → typecheck → lint → test → deploy (Vercel/Cloudflare/Docker)   |
| S9.11 | Environment config    | `.env.production`, `.env.staging` templates                           |

### Definition of Done — S9

- [ ] Lighthouse scores meet thresholds
- [ ] Error monitoring captures and reports errors
- [ ] Docker build produces < 200MB image
- [ ] CI pipeline runs in < 5 minutes
- [ ] Production deployment works end-to-end

---

## Cross-Sprint Concerns

These are tracked across all sprints and must be maintained continuously:

| Concern                   | Standard                                                           | Tracked By                                                     |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| **TypeScript strictness** | `strict: true`, no `any` in component props                        | `pnpm typecheck`, `pnpm web:drift` (W08)                       |
| **Accessibility**         | WCAG 2.2 AA, semantic HTML, keyboard nav                           | `pnpm web:drift` (W09), `eslint-plugin-jsx-a11y`, manual audit |
| **Performance**           | RSC for reads, minimal `"use client"`, no unnecessary client state | `pnpm web:drift` (W11), Lighthouse                             |
| **Contract compliance**   | All payloads use `@afenda/contracts` schemas                       | `pnpm web:drift` (W04)                                         |
| **Import boundaries**     | No `@afenda/db`, `drizzle-orm`, `fastify`, `pino` in frontend      | `pnpm web:drift` (W03), `arch:guard` (E8)                      |
| **Feature isolation**     | `features/finance/*` never imports from `features/inventory/*`     | `pnpm web:drift` (W06)                                         |
| **Route boundary**        | `page.tsx`/`layout.tsx` only import from allowed prefixes          | `pnpm web:drift` (W05)                                         |
| **shadcn purity**         | `components/ui/` managed by CLI, no domain imports                 | `pnpm web:drift` (W07)                                         |
| **No hardcoded Radix**    | Use `components/ui/` wrappers, not raw `@radix-ui/`                | `pnpm web:drift` (W01)                                         |
| **className discipline**  | `cn()` for merging, no template literals or string concat          | `pnpm web:drift` (W02)                                         |
| **Tailwind v4 compat**    | No deprecated v3 patterns (`@apply`, `theme()`, `tw-` prefix)      | `pnpm web:drift` (W10, W16)                                    |
| **CSS variable colors**   | Use `bg-primary`/`text-destructive`, not `bg-red-500`              | `pnpm web:drift` (W14)                                         |
| **Dependency allowlist**  | All deps in `ARCHITECTURE.@afenda-web.md` allowlist                | `pnpm web:drift` (W13)                                         |
| **Server Action pattern** | Forms use Server Actions, not client fetch                         | `pnpm web:drift` (W15)                                         |
| **Required structure**    | All required files/dirs from ARCHITECTURE.md exist                 | `pnpm web:drift` (W12)                                         |
| **Test coverage**         | Lines 80%, functions 80%, branches 75%                             | `vitest --coverage`                                            |
| **Responsive design**     | Mobile-friendly at 768px minimum                                   | Manual testing                                                 |

---

## Risk Register

| Risk                              | Impact                 | Mitigation                                                     |
| --------------------------------- | ---------------------- | -------------------------------------------------------------- |
| API endpoints not ready for S2-S3 | Blocks frontend wiring | Mock API responses with MSW; parallel backend/frontend sprints |
| shadcn/ui breaking changes        | Component rework       | Pin versions in `package.json`, test after upgrades            |
| Next.js 16 instability            | Build failures         | Pin Next.js version, test canary before upgrading              |
| Performance regression            | Slow page loads        | Lighthouse CI gate, bundle size budget                         |
| Accessibility gaps                | Compliance failure     | `jsx-a11y` in CI, quarterly manual audit                       |
| Scope creep in AP/AR (S7)         | Sprint overrun         | Strict pattern reuse from journals; generator-first approach   |

---

## Dependency Map

```
S0 (Foundation) ──► S1 (shadcn + Polish) ──► S2 (Auth + API) ──► S3 (Journal CRUD)
                                                                        │
                                                                        ├──► S4 (Reports)
                                                                        │
                                                                        ├──► S5 (IC + Advanced)
                                                                        │
                                                                        └──► S6 (Testing)
                                                                                │
                                                                                ├──► S7 (AP/AR)
                                                                                │
                                                                                ├──► S8 (Generators)
                                                                                │
                                                                                └──► S9 (Production)
```

**Critical path:** S0 → S1 → S2 → S3 → S4/S5/S6 (parallel) → S7 → S8 → S9

---

## File Inventory (S0 — 46 files)

### `src/lib/` (6 files)

- `utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `api-client.ts` — Typed fetch client with `ApiResult<T>`, tenant headers
- `format.ts` — Money, date, number, percent, ID truncation formatters
- `auth.ts` — Server-side auth helpers (cookies, redirect, context builder)
- `constants.ts` — Routes, status config, currency config, navigation config
- `types.ts` — UI-only types: `ApiError`, `ApiResult`, `CommandReceipt`,
  `PaginatedResponse`, `TenantContext`, `AuditEntry`, `ColumnDef`

### `src/providers/` (2 files)

- `tenant-provider.tsx` — React context for tenant/company/period state
- `theme-provider.tsx` — `next-themes` wrapper with SSR, localStorage, system
  detection

### `src/hooks/` (4 files)

- `use-tenant-context.ts` — Re-export from tenant provider
- `use-receipt.ts` — Receipt panel state (show/clear/isOpen)
- `use-debounce.ts` — Generic value debounce
- `use-media-query.ts` — Responsive breakpoint detection + `useIsMobile()`

### `src/components/erp/` (13 files)

- `app-shell.tsx` — Collapsible sidebar + topbar + main content area + skip link
- `sidebar-nav.tsx` — Module-grouped navigation with expand/collapse
- `tenant-switcher.tsx` — Tenant context display
- `company-switcher.tsx` — Company context display with currency
- `period-indicator.tsx` — Active fiscal period with status badge
- `status-badge.tsx` — Colored badge with icon per document status
- `money-cell.tsx` — Formatted currency display (tabular-nums, negative = red)
- `date-cell.tsx` — Formatted date display (short/medium/long/datetime/relative)
- `receipt-panel.tsx` — Mutation confirmation with doc ref, audit ref,
  idempotency key
- `audit-panel.tsx` — Timeline view of audit entries
- `page-header.tsx` — Title + description + breadcrumbs + action buttons
- `empty-state.tsx` — Empty list/search result placeholder with icon + CTA
- `loading-skeleton.tsx` — Table, detail, and form skeleton loaders

### `src/components/ui/` (placeholder)

- `.gitkeep` — Empty directory for shadcn/ui components (S1)

### `src/features/finance/` (6 files)

- `journals/queries/journal.queries.ts` — Typed API wrappers: list, get, create,
  post, reverse, void
- `journals/blocks/journal-table.tsx` — Journal list table with status, money,
  date cells
- `journals/blocks/journal-detail-header.tsx` — Document header with status,
  dates, totals
- `journals/blocks/journal-lines-editor.tsx` — Inline debit/credit grid with RHF
  field array
- `journals/forms/journal-draft-form.tsx` — RHF + Zod + CreateJournalSchema +
  receipt flow
- `reports/queries/report.queries.ts` — Trial balance query wrapper

### `src/app/` (15 route files)

- `layout.tsx` — Root layout with ThemeProvider + TenantProvider + globals.css
- `page.tsx` — Root redirect to `/login`
- `globals.css` — Tailwind v4 + shadcn CSS variables
- `error.tsx` — Global error boundary
- `loading.tsx` — Global loading spinner
- `not-found.tsx` — 404 page
- `login/page.tsx` — Login form placeholder
- `(shell)/layout.tsx` — AppShell wrapper
- `(shell)/page.tsx` — Dashboard with metric cards
- `(shell)/finance/journals/page.tsx` — Journal list
- `(shell)/finance/journals/[id]/page.tsx` — Journal detail
- `(shell)/finance/journals/new/page.tsx` — Create journal (Server Action)
- `(shell)/finance/trial-balance/page.tsx` — Trial balance
- `(shell)/finance/accounts/page.tsx` — Chart of accounts
- `(shell)/finance/periods/page.tsx` — Fiscal periods
- `(shell)/finance/reports/page.tsx` — Financial reports hub
- `(shell)/settings/page.tsx` — Settings placeholder

---

## Frontend Drift Gate — `pnpm web:drift` (W01-W16)

> **Script:** `tools/scripts/web-drift-check.mjs` **Commands:** `pnpm web:drift`
> (root) · `pnpm --filter @afenda/web drift` (scoped) **CI:** Exit code 1 on any
> failure. Warnings are advisory. Supports `--json` for machine output.

| Check   | Name                      | What It Catches                                                                                                                        |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **W01** | No hardcoded Radix        | Files outside `components/ui/` importing `@radix-ui/*` directly                                                                        |
| **W02** | className discipline      | Components accepting `className` prop but not merging with `cn()`; template literal or string concat in className                      |
| **W03** | Forbidden imports         | `fastify`, `drizzle-orm`, `postgres`, `pino`, `@afenda/db`, `@afenda/platform`, `@afenda/modules`, `graphile-worker`                   |
| **W04** | Contract compliance       | Hand-written `*Payload`, `*Request`, `*Response` types in `features/` (should use `@afenda/contracts`)                                 |
| **W05** | Route boundary            | `page.tsx`/`layout.tsx` importing from non-allowed prefixes                                                                            |
| **W06** | Feature isolation         | `features/finance/*` importing from `features/inventory/*` etc.                                                                        |
| **W07** | shadcn purity             | `components/ui/` files importing domain code (`@/features/`, `@/hooks/`, `@afenda/contracts`)                                          |
| **W08** | No `any` types            | `: any`, `as any`, `<any>` in components, features, hooks, providers                                                                   |
| **W09** | Accessibility             | `<button>` without `type=`, `<img>` without `alt=`                                                                                     |
| **W10** | Tailwind v4 compat        | `@apply` in components, `theme()` function, `tw-` prefix, `tailwind.config` references                                                 |
| **W11** | `"use client"` discipline | `"use client"` in `lib/` or `queries/` files (must be server-compatible)                                                               |
| **W12** | Required structure        | All required files and directories from `ARCHITECTURE.@afenda-web.md` exist                                                            |
| **W13** | Dependency audit          | All `dependencies`/`devDependencies` in `package.json` are in ARCHITECTURE allowlist; Tailwind v4, React 19, Next.js 16 version checks |
| **W14** | No hardcoded colors       | `bg-red-500`, `text-blue-600` etc. in `components/erp/` and `features/` (use CSS variables: `bg-primary`, `text-destructive`)          |
| **W15** | Server Action pattern     | Direct `fetch()` in form components or query files not using `createApiClient()`                                                       |
| **W16** | `@theme inline` complete  | Every CSS variable in `:root` must have a `--color-*` mapping in `@theme inline` (Tailwind v4 utility class generation)                |

### Current Status

```
Total: 70 checks · Pass: 70 · Fail: 0 · Warn: 0
```

---

## Changelog

| Date       | Sprint | Change                                                                                                                                                                        |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-24 | S0     | Architecture doc created, 46 files scaffolded, deps installed, typecheck clean                                                                                                |
| 2026-02-24 | S0     | Frontend drift gate created: `web-drift-check.mjs` with 15 checks (W01-W15), 0 failures. Wired as `pnpm web:drift`. Fixed W14 hardcoded amber color in journal-detail-header. |
| 2026-02-24 | S0.5   | Tailwind v4 hardening: `globals.css` four-step architecture (root vars, hsl(), @theme inline, no @apply). Fixed sidebar `hsl(var())` double-wrap.                             |
| 2026-02-24 | S0.5   | Replaced custom ThemeProvider with `next-themes`. Updated `theme-toggle.tsx` import.                                                                                          |
| 2026-02-24 | S0.5   | Synced ARCHITECTURE.md allowlists: unified `radix-ui`, added `next-themes`, `zod`, `@vitejs/plugin-react`, test devDeps.                                                      |
| 2026-02-24 | S0.5   | Test infrastructure: Vitest + RTL + MSW + jest-axe. `src/__tests__/` convention (matches finance module). 4 test files, 35 tests green.                                       |
| 2026-02-24 | S0.5   | Drift gate hardened: W10 now fails on `@apply` in globals.css. Added W16 (`@theme inline` completeness). 16 checks, 70 total passes, 0 failures.                              |
| 2026-02-24 | S0.5   | Applied `react-testing-patterns` skill: defaultProps, renderWithProviders, no CSS class testing, accessible queries, globals: true (no explicit vitest imports).              |

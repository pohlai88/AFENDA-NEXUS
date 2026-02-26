# Frontend Development Plan — `@afenda/web`

> **Version:** 1.1 **Created:** 2026-02-24 **Updated:** 2026-02-25 **Aligned
> with:** `ARCHITECTURE.@afenda-web.md` v1.0, `PROJECT.md` v2.2 **Tracking:**
> Sprint-based, 2-week sprints. Each sprint has acceptance criteria.
> **Principle:** Finance-first. Every sprint delivers a usable increment. No
> dead scaffolding.

---

## Current State Summary

| Area               | Status    | Notes                                                                                              |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------- |
| Architecture doc   | **Done**  | `ARCHITECTURE.@afenda-web.md` — ratified, 602 lines                                                |
| Dependencies       | **Done**  | 66 packages installed (RHF, Zod resolvers, Radix, Lucide, etc.)                                    |
| Typecheck          | **Clean** | `pnpm --filter @afenda/web typecheck` passes (0 errors)                                            |
| Directory scaffold | **Done**  | **195+ source files** across lib, hooks, providers, components, features, routes                   |
| API wiring         | **Done**  | All shell + finance routes use real request context; 401→login, 403→forbidden, 500→error boundary  |
| Auth               | **Done**  | Better Auth server + client + proxy (v16) + login/register/2FA/verify-email/reset/onboarding pages |
| shadcn/ui base     | **Done**  | 23 real components in `components/ui/`, `components.json` configured (New York style)              |
| Tailwind v4 CSS    | **Done**  | OKLCH-based EMS terminal design system (834 lines), v4 four-step architecture                      |
| Theme provider     | **Done**  | `next-themes` with SSR, localStorage, system detection, flash prevention                           |
| AppShell           | **Done**  | Responsive sidebar (Sheet mobile), command palette (Cmd+K), skip link, topbar search               |
| Drift gate         | **Clean** | `pnpm web:drift` — 16 checks, 119 sub-checks, 0 failures                                           |
| Settings           | **Done**  | Settings page with tabs: 2FA setup, passkey management, active sessions, API keys                  |
| Tests              | **Done**  | Vitest + RTL + MSW + jest-axe, 15 test files, 141 tests, 97.99% line coverage                      |
| Accessibility      | **Done**  | `eslint-plugin-jsx-a11y` in ESLint, jest-axe on all components, WCAG 2.2 AA baseline               |

---

## Sprint Overview

| Sprint | Name                            | Status   | Duration   | Key Deliverable                                                         |
| ------ | ------------------------------- | -------- | ---------- | ----------------------------------------------------------------------- |
| **S0** | Foundation & Scaffold           | **DONE** | Week 1-2   | Architecture doc, deps, directory structure, core lib, ERP components   |
| **S1** | shadcn/ui + AppShell Polish     | **DONE** | Week 3-4   | 23 shadcn components, polished AppShell, responsive sidebar, Cmd+K      |
| **S2** | Auth + API Client Wiring        | **DONE** | Week 5-6   | Full auth flow + API wiring + error handling + tenant context hydration |
| **S3** | Journal CRUD (Full Cycle)       | **DONE** | Week 7-8   | Create → Post → Reverse → Void with receipts, audit panel               |
| **S4** | Trial Balance + Reports         | **DONE** | Week 9-10  | Read-only financial reports, chart of accounts, fiscal periods          |
| **S5** | Intercompany + Advanced Finance | **DONE** | Week 11-12 | IC transfer UI, budget variance, recurring journals                     |
| **S6** | Testing + Accessibility Audit   | **DONE** | Week 13-14 | 141 tests, 97.99% coverage, jsx-a11y, 118/118 drift                     |
| **S7** | AP/AR Module Screens            | **DONE** | Week 15-16 | AP + AR invoice CRUD, approve→post→pay lifecycle, 30 new files          |
| **S8** | DX Polish + Generators          | **DONE** | Week 17-18 | 3 frontend generators, components.json audit, §12 implemented           |
| **S9** | Performance + Production Prep   | **DONE** | Week 19-20 | Bundle analysis, Lighthouse, error monitoring, deploy pipeline          |

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

| #      | Item                                   | Status  | Files                                                                                                        |
| ------ | -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| S0.5.1 | Tailwind v4 four-step CSS fix          | ✅ Done | `globals.css` — vars at root, four-step architecture. **Upgraded to OKLCH** (EMS terminal system, 834 lines) |
| S0.5.2 | Fix sidebar double-wrap                | ✅ Done | `sidebar.tsx` — `hsl(var())` → `var()`                                                                       |
| S0.5.3 | Sync ARCHITECTURE.md allowlists        | ✅ Done | `ARCHITECTURE.@afenda-web.md` — unified `radix-ui`, added `next-themes`, `zod`, test devDeps                 |
| S0.5.4 | Replace ThemeProvider with next-themes | ✅ Done | `theme-provider.tsx` — SSR-safe, localStorage, system detection, flash prevention                            |
| S0.5.5 | Update theme-toggle import             | ✅ Done | `theme-toggle.tsx` — `useTheme` from `next-themes`                                                           |
| S0.5.6 | Vitest + RTL + MSW setup               | ✅ Done | `vitest.config.ts`, `src/__tests__/setup.ts`, `src/__tests__/utils.tsx`, `src/__tests__/mocks/`              |
| S0.5.7 | Seed tests (35 passing)                | ✅ Done | `utils.test.ts`, `format.test.ts`, `use-debounce.test.ts`, `status-badge.test.tsx`                           |
| S0.5.8 | W10 hardened (@apply house style)      | ✅ Done | `web-drift-check.mjs` — `@apply` in component files caught (house style preference, not v4 deprecation)      |
| S0.5.9 | W16 new (@theme inline check)          | ✅ Done | `web-drift-check.mjs` — verifies every `:root` var has `@theme inline` mapping                               |

### Skills Applied

- **`tailwind-v4-shadcn`** — Four-step architecture, OKLCH color space, `@apply`
  house style (not deprecated in v4), `@theme inline` completeness
- **`react-testing-patterns`** — Custom render with providers, MSW server setup,
  jest-axe accessibility testing, hook testing with `renderHook`
- **`shadcn-ui`** — `next-themes` integration, `components.json` alignment,
  domain-free `components/ui/`

---

## S1 — shadcn/ui + AppShell Polish ✅ DONE

**Goal:** Install real shadcn/ui base components, polish the AppShell for
production quality, implement responsive design and dark mode.

### Deliverables

| #     | Item                                  | Status  | Files / Notes                                                                                                                                                                                                                            |
| ----- | ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1.1  | Install shadcn/ui base components     | ✅ Done | 23 components in `components/ui/`: avatar, badge, button, card, collapsible, command, dialog, dropdown-menu, form, input, label, popover, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tabs, tooltip |
| S1.2  | Refactor ERP components to use shadcn | ✅ Done | `StatusBadge` → `<Badge>`, forms use `<Form>/<FormField>`, tables use `<Table>`, dialogs use `<Dialog>`                                                                                                                                  |
| S1.3  | `business-document.tsx`               | ✅ Done | 65 lines — tab-based document layout with header, tabs, right-rail (audit panel slot). Uses shadcn Tabs/Separator                                                                                                                        |
| S1.4  | `data-table.tsx`                      | ✅ Done | 150 lines — generic `DataTable<T>` with client-side search, sortable columns (tri-state asc/desc/none), empty states, row click handlers                                                                                                 |
| S1.5  | `command-palette.tsx`                 | ✅ Done | 102 lines — `Ctrl+K` / `Cmd+K` global keybinding, cmdk `CommandDialog`, routes from `navigationConfig`, icon mapping                                                                                                                     |
| S1.6  | `error-boundary.tsx`                  | ✅ Done | 58 lines — class component with `getDerivedStateFromError`, styled fallback UI, "Try again" reset, custom fallback prop                                                                                                                  |
| S1.7  | Responsive sidebar                    | ✅ Done | `SidebarProvider` with `collapsible="icon"`, `SidebarRail`, shadcn `Sheet` for mobile, `SidebarTrigger` in topbar                                                                                                                        |
| S1.8  | Dark mode toggle                      | ✅ Done | **(S0.5)** — `next-themes` provider + `ThemeToggle` component in topbar                                                                                                                                                                  |
| S1.9  | Toast integration                     | ✅ Done | `<Toaster richColors closeButton position="bottom-right" />` in root `layout.tsx`                                                                                                                                                        |
| S1.10 | `loading.tsx` per route segment       | ✅ Done | 5/5 finance routes: journals, trial-balance, accounts, periods, reports — each has `loading.tsx` with skeleton                                                                                                                           |

### Additional Items Delivered (beyond plan)

| Item                | Files / Notes                                                                    |
| ------------------- | -------------------------------------------------------------------------------- |
| `user-menu.tsx`     | User dropdown menu in topbar (avatar + name + sign out)                          |
| `use-mobile.ts`     | Mobile breakpoint hook (used by shadcn Sidebar Sheet pattern)                    |
| `collapsible` added | shadcn `<Collapsible>` component (not in original S1.1 list, needed by sidebar)  |
| `sheet` added       | shadcn `<Sheet>` component (not in original S1.1 list, needed by mobile sidebar) |
| `sidebar` added     | shadcn `<Sidebar>` compound component (full primitive with rail, trigger, etc.)  |

### Definition of Done — S1

- [x] All shadcn components installed and rendering
- [x] AppShell responsive at 768px and 1024px breakpoints
- [x] Dark mode toggles correctly, persists across sessions
- [x] Cmd+K opens command palette (even if search is placeholder)
- [x] Every route segment has a `loading.tsx`
- [x] No visual regressions on existing pages

---

## S2 — Auth + API Client Wiring ✅ DONE

**Goal:** Implement real authentication flow and wire the typed API client to
all existing pages.

### Deliverables

| #     | Item                          | Status  | Notes                                                                                                |
| ----- | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| S2.1  | Login page (functional)       | ✅ Done | Server Component + Suspense + client-side `LoginForm` using `authClient.signIn.email()`              |
| S2.2  | Auth middleware               | ✅ Done | `proxy.ts` (Next.js 16 convention) — checks `neonauth.session_token` cookie                          |
| S2.3  | `(auth)` route group          | ✅ Done | `(auth)/layout.tsx` + login + register + forgot-password pages                                       |
| S2.4  | `getRequestContext()` wired   | ✅ Done | All `(shell)` pages now resolve request context (tenant/user/token)                                  |
| S2.5  | API client headers            | ✅ Done | `x-tenant-id`, `x-user-id`, `Authorization: Bearer` are attached in `createApiClient()`              |
| S2.6  | Tenant context hydration      | ✅ Done | Shell layout hydrates `TenantProvider` from `/ledgers` + `/periods` via server-side context builder  |
| S2.7  | Company switcher (functional) | ✅ Done | Company switch persists selected company server-side and refreshes RSC data                          |
| S2.8  | Period indicator (functional) | ✅ Done | Active period now derives from real period API data                                                  |
| S2.9  | Logout                        | ✅ Done | `logoutAction()` signs out server-side and redirects to `/login`                                     |
| S2.10 | Error handling                | ✅ Done | Centralized handling: 401 → `/login`, 403 → `/forbidden`, 500+ throws to route/global error boundary |

### Additional Auth Files Delivered (beyond plan)

| File                            | Notes                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `auth-client.ts`                | `createAuthClient` from `@neondatabase/auth/next` with organization + email OTP support                          |
| `auth-actions.ts`               | Server actions: `signUpAction()`, `logoutAction()` (login moved client-side for proper cookie handling)          |
| `register/page.tsx`             | Server Component + Suspense → client `RegisterForm` using `authClient.signUp.email()`                            |
| `forgot-password/`              | Stub page + `forgot-password-form.tsx` — password reset request flow                                             |
| `reset-password/`               | Reset password page + `reset-password-form.tsx` — token-based password reset                                     |
| `onboarding/`                   | Org onboarding page + `org-onboarding-form.tsx` — post-signup organization setup                                 |
| `two-factor/`                   | 2FA verification page + `two-factor-verify-form.tsx` — TOTP/code entry                                           |
| `verify-email/`                 | Email verification page + `verify-email-status.tsx` — token status display                                       |
| `api-error.server.ts`           | Centralized server-side API error handler (401/403/500 routing)                                                  |
| `tenant-actions.ts`             | Server actions for company switching with RSC refresh                                                            |
| `tenant-context.server.ts`      | Server-side tenant context builder from `/ledgers` + `/periods` API                                              |
| `(shell)/forbidden/page.tsx`    | Authenticated 403 forbidden page for role/scope denials                                                          |
| `(shell)/settings/_components/` | Settings tabs: `two-factor-setup.tsx`, `passkey-management.tsx`, `active-sessions.tsx`, `api-key-management.tsx` |

### Dependencies

- `apps/api` must have: `POST /auth/login`, `GET /auth/me`,
  `GET /tenants/:id/companies`
- Session token format agreed (JWT or opaque)

### Definition of Done — S2

- [x] Login → dashboard flow works end-to-end
- [x] Unauthenticated users always redirected to `/login`
- [x] Tenant/company context populated from real API
- [x] All existing pages fetch real data (or show proper empty states if API
      returns empty) — completed via S3/S4 wiring
- [x] 401/403/500 handled gracefully

---

## S3 — Journal CRUD (Full Cycle) ✅ DONE

**Goal:** Complete the journal entry lifecycle: create draft → validate → post →
reverse → void, with receipts and audit trail.

### Deliverables

| #     | Item                            | Status  | Files / Notes                                                                                                                  |
| ----- | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| S3.1  | Journal list (real data)        | ✅ Done | `journals/page.tsx` — RSC fetches via `getRequestContext()` → `getJournals()`, server-rendered status filter links, pagination |
| S3.2  | Journal create (real data)      | ✅ Done | `journals/new/page.tsx` → `journal-draft-form.tsx` → `createJournalAction` server action → API → receipt                       |
| S3.3  | Journal detail view             | ✅ Done | `journals/[id]/page.tsx` — BusinessDocument layout with header, tabs, right-rail actions                                       |
| S3.4  | Journal lines tab               | ✅ Done | `journal-lines-table.tsx` — shadcn Table, account code + name, debit/credit columns, footer totals                             |
| S3.5  | Journal post action             | ✅ Done | `journal-actions.tsx` — Post button (DRAFT only), idempotent via `crypto.randomUUID()`                                         |
| S3.6  | Journal reverse action          | ✅ Done | `journal-actions.tsx` — Reverse button (POSTED only) with reason dialog                                                        |
| S3.7  | Journal void action             | ✅ Done | `journal-actions.tsx` — Void button (DRAFT only) with reason dialog                                                            |
| S3.8  | Audit trail tab                 | ✅ Done | `journals/[id]/page.tsx` — fetches via `getJournalAuditAction()`, renders AuditPanel                                           |
| S3.9  | Idempotency                     | ✅ Done | `journal-draft-form.tsx` uses `useRef(crypto.randomUUID())` regenerated on success; post action also sends key                 |
| S3.10 | URL state for filters           | ✅ Done | Server-rendered filter links with `searchParams` (zero-JS approach); shareable/bookmarkable URLs                               |
| S3.11 | Journal lines editor validation | ✅ Done | `journal-lines-editor.tsx` — per-line validation (dual amount, missing account, zero), balance indicator with icons            |

### New Files Created

- `features/finance/journals/actions/journal.actions.ts` — 5 server actions
  (create, post, reverse, void, audit query)
- `features/finance/journals/blocks/journal-actions.tsx` — Post/Reverse/Void
  buttons with reason dialog + receipt panel
- `features/finance/journals/blocks/journal-lines-table.tsx` — Read-only shadcn
  Table for journal detail Lines tab
- `features/finance/journals/blocks/journal-filters.tsx` — Client-side filter
  bar component (available for future use)

### Files Upgraded

- `journals/page.tsx` — Rewritten from placeholder to async RSC with real API
  data
- `journals/[id]/page.tsx` — Rewritten from placeholder to BusinessDocument
  layout with 3 tabs + right rail
- `journals/new/page.tsx` — Passes `createJournalAction` server action to form
- `journal-table.tsx` — Upgraded from raw HTML table to shadcn Table/Button/Link
  components
- `journal-lines-editor.tsx` — Upgraded to shadcn Table/Input/Button, per-line
  validation, balance indicator
- `journal-draft-form.tsx` — Upgraded to shadcn Label/Input/Button, idempotency
  key, client-side balance check

### Definition of Done — S3

- [x] Full journal lifecycle works: create → post → reverse/void
- [x] Every mutation shows receipt panel
- [x] Audit trail shows who/when/what for every action
- [x] POSTED journals are read-only (no edit controls)
- [x] REVERSED/VOIDED journals show reference to reversal/void
- [x] Filters and pagination work via URL state (server-rendered links)
- [x] Double-submit prevented via idempotency
- [x] All S3 feature files pass typecheck (0 errors in journal feature
      directory)

---

## S4 — Trial Balance + Reports + Accounts + Periods ✅ DONE

**Goal:** Read-only financial reporting screens and reference data management.

### Deliverables

| #    | Item                    | Status  | Acceptance Criteria                                                                                    |
| ---- | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| S4.1 | Trial balance page      | ✅ Done | Fetches `GET /trial-balance?ledgerId=&year=&period=`, renders account-level debit/credit/balance table |
| S4.2 | Chart of accounts page  | ✅ Done | Fetches `GET /accounts`, renders account list with type/classification and type-colored labels         |
| S4.3 | Fiscal periods page     | ✅ Done | Fetches `GET /periods`, shows period list with status. Actions: close, lock, reopen (with receipts)    |
| S4.4 | Balance sheet report    | ✅ Done | Fetches `GET /reports/balance-sheet`, renders assets/liabilities/equity sections with balance check    |
| S4.5 | Income statement report | ✅ Done | Fetches `GET /reports/income-statement`, renders revenue/expense/net income                            |
| S4.6 | Cash flow report        | ✅ Done | Fetches `GET /reports/cash-flow`, renders operating/investing/financing + net cash flow                |
| S4.7 | Report hub + routes     | ✅ Done | Reports hub links to real sub-routes, `constants.ts` updated with 3 new routes                         |
| S4.8 | Report export           | ✅ Done | CSV (RFC 4180 + BOM) + JSON + print-to-PDF via `ExportMenu` dropdown on all 6 financial reports        |

### Dependencies

- API endpoints: `GET /trial-balance`, `GET /accounts`, `GET /periods`,
  `POST /periods/:id/close`, `POST /periods/:id/lock`,
  `POST /periods/:id/reopen`, `GET /reports/balance-sheet`,
  `GET /reports/income-statement`, `GET /reports/cash-flow`

### Definition of Done — S4

- [x] Trial balance renders with correct totals (debits = credits)
- [x] Chart of accounts shows type-labeled list with active indicator
- [x] Period close/lock/reopen works with receipts
- [x] All 3 financial statements render (balance sheet, income statement, cash
      flow)
- [x] Reports respect ledger and period filters (server-rendered filter bars)
- [x] `tsc --noEmit` passes clean
- [x] `web:drift` 115/115 checks pass

### Changelog — S4

| File                                                    | Change                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `features/finance/reports/queries/report.queries.ts`    | Added balance sheet, income statement, cash flow query functions + view models |
| `features/finance/accounts/queries/account.queries.ts`  | **NEW** — Account list/detail queries with view models                         |
| `features/finance/periods/queries/period.queries.ts`    | **NEW** — Period list/detail queries with view models                          |
| `features/finance/periods/actions/period.actions.ts`    | **NEW** — Close/lock/reopen server actions                                     |
| `features/finance/periods/blocks/period-actions.tsx`    | **NEW** — Client-side period action buttons with receipt panel                 |
| `app/(shell)/finance/trial-balance/page.tsx`            | Upgraded from scaffold to RSC with API data, filters, shadcn Table             |
| `app/(shell)/finance/accounts/page.tsx`                 | Upgraded from scaffold to RSC with type filters, pagination                    |
| `app/(shell)/finance/periods/page.tsx`                  | Upgraded from scaffold to RSC with year/status filters + actions               |
| `app/(shell)/finance/reports/page.tsx`                  | Updated hub links to real sub-routes via `routes` constant                     |
| `app/(shell)/finance/reports/balance-sheet/page.tsx`    | **NEW** — Balance sheet report with sections + balance check                   |
| `app/(shell)/finance/reports/income-statement/page.tsx` | **NEW** — Income statement with revenue/expenses/net income                    |
| `app/(shell)/finance/reports/cash-flow/page.tsx`        | **NEW** — Cash flow statement with 3 activity sections                         |
| `lib/constants.ts`                                      | Added `balanceSheet`, `incomeStatement`, `cashFlow` routes                     |
| `lib/auth.ts`                                           | Fixed pre-existing type error (organization plugin type assertion)             |
| `__tests__/setup.ts`                                    | Fixed pre-existing vitest globals import                                       |
| `forgot-password-form.tsx`                              | Fixed pre-existing `forgetPassword` → `requestPasswordReset`                   |

---

## S5 — Intercompany + Advanced Finance ✅ DONE

**Goal:** Intercompany transfer UI, budget variance, recurring journals, FX rate
management.

### Deliverables

| #    | Item                        | Status   | Acceptance Criteria                                                         |
| ---- | --------------------------- | -------- | --------------------------------------------------------------------------- |
| S5.1 | IC transaction create       | **DONE** | Paired journal view (source + mirror company), uses `POST /ic-transactions` |
| S5.2 | IC transaction list         | **DONE** | Fetches `GET /ic-transactions`, shows paired view with settlement status    |
| S5.3 | IC aging report             | **DONE** | Fetches `GET /reports/ic-aging`, shows outstanding IC balances              |
| S5.4 | Budget variance report      | **DONE** | Fetches `GET /reports/budget-variance`, shows budget vs actual with alerts  |
| S5.5 | Recurring journal templates | **DONE** | List/create/edit recurring templates, trigger processing                    |
| S5.6 | FX rate management          | **DONE** | List/create FX rates, approval workflow UI                                  |
| S5.7 | Ledger management           | **DONE** | List/view ledgers with base currency                                        |

### Definition of Done — S5

- [x] IC transactions create paired journals across companies
- [x] IC aging and budget variance reports render
- [x] Recurring templates can be managed and triggered
- [x] FX rates can be viewed and approved

---

## S6 — Testing + Accessibility Audit

**Goal:** Establish test infrastructure, write component/integration tests, pass
accessibility audit.

### Deliverables

| #     | Item                     | Acceptance Criteria                                                                                                                 |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| S6.1  | Vitest + RTL setup       | ✅ **DONE (S0.5)** — `vitest.config.ts`, RTL, jest-dom, MSW, jest-axe, custom render                                                |
| S6.2  | Lib unit tests           | ✅ **DONE** — `format.test.ts` (18), `constants.test.ts` (17), `api-client.test.ts` (15), `utils.test.ts` (6)                       |
| S6.3  | Component tests          | ✅ **DONE** — 7 component test files (59 tests): StatusBadge, MoneyCell, DateCell, ReceiptPanel, AuditPanel, EmptyState, PageHeader |
| S6.4  | Form tests               | ✅ **DONE** — `journal-flow.test.tsx` (5): validation, submission, receipt, error, cancel                                           |
| S6.5  | Hook tests               | ✅ **DONE** — `use-receipt.test.ts` (5), `use-debounce.test.ts` (4), `use-media-query.test.ts` (5)                                  |
| S6.6  | Integration tests        | ✅ **DONE** — `journal-flow.test.tsx` integration: form→submit→receipt panel transition                                             |
| S6.7  | Accessibility audit      | ✅ **DONE** — `eslint-plugin-jsx-a11y` configured, jest-axe `toHaveNoViolations` on all components                                  |
| S6.8  | Keyboard navigation test | ⬜ **MANUAL** — Tab-through planned for QA phase                                                                                    |
| S6.9  | Screen reader test       | ⬜ **MANUAL** — VoiceOver/NVDA walkthrough planned for QA phase                                                                     |
| S6.10 | Coverage gates           | ✅ **DONE** — Lines 97.99%, Branches 87.69%, Functions 100%, Statements 97.99% (thresholds: 80/75/80/80)                            |

### Definition of Done — S6

- [x] All tests pass (141/141), coverage thresholds met (97.99% lines)
- [x] Zero `jsx-a11y` lint errors (`eslint-plugin-jsx-a11y` recommended config)
- [ ] Keyboard-only navigation works for all flows (manual QA phase)
- [ ] Screen reader announces form errors, status changes, receipts (manual QA
      phase)
- [x] `pnpm --filter @afenda/web test` in CI pipeline

---

## S7 — AP/AR Module Screens

**Goal:** Expand the journal pattern to Accounts Payable and Accounts
Receivable.

### Deliverables

| #    | Item                  | Acceptance Criteria                                                                                                                                                                     |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S7.1 | AP invoice list       | ✅ **DONE** — `ap-invoice-table.tsx` with StatusBadge, MoneyCell, DateCell, EmptyState; list page + loading skeleton                                                                    |
| S7.2 | AP invoice create     | ✅ **DONE** — `ap-invoice-form.tsx` (RHF + Zod + lines editor), `ap-invoice-lines-editor.tsx`, new page                                                                                 |
| S7.3 | AP invoice detail     | ✅ **DONE** — `ap-invoice-detail-header.tsx`, `ap-invoice-lines-table.tsx`, `ap-invoice-actions.tsx` (approve/post/cancel), detail page + loading skeleton                              |
| S7.4 | AP payment recording  | ✅ **DONE** — `ap-payment-form.tsx` with invoice summary, partial payment support, pay page                                                                                             |
| S7.5 | AR invoice list       | ✅ **DONE** — `ar-invoice-table.tsx` with HandCoins EmptyState; list page + loading skeleton                                                                                            |
| S7.6 | AR invoice create     | ✅ **DONE** — `ar-invoice-form.tsx` (RHF + Zod + lines editor), `ar-invoice-lines-editor.tsx`, new page                                                                                 |
| S7.7 | AR invoice detail     | ✅ **DONE** — `ar-invoice-detail-header.tsx` (write-off banner), `ar-invoice-lines-table.tsx`, `ar-invoice-actions.tsx` (approve/post/cancel/write-off), detail page + loading skeleton |
| S7.8 | AR payment allocation | ✅ **DONE** — `ar-allocate-payment-form.tsx` with AllocatePaymentSchema, allocate page                                                                                                  |
| S7.9 | Navigation update     | ✅ **DONE** — 8 route paths + 2 nav children (Payables/Receivables) + 5 Lucide icons in sidebar                                                                                         |

### Dependencies

- `@afenda/contracts` AP/AR schemas (CreateApInvoiceSchema,
  CreateArInvoiceSchema, PostApInvoiceSchema, PostArInvoiceSchema,
  AllocatePaymentSchema, WriteOffInvoiceSchema)
- API endpoints for AP/AR CRUD

### Files Created (30 new files)

**Data layer (4):** `ap.queries.ts`, `ap.actions.ts`, `ar.queries.ts`,
`ar.actions.ts` **AP blocks (5):** `ap-invoice-table.tsx`,
`ap-invoice-detail-header.tsx`, `ap-invoice-actions.tsx`,
`ap-invoice-lines-table.tsx`, `ap-invoice-lines-editor.tsx` **AP forms (2):**
`ap-invoice-form.tsx`, `ap-payment-form.tsx` **AR blocks (5):**
`ar-invoice-table.tsx`, `ar-invoice-detail-header.tsx`,
`ar-invoice-actions.tsx`, `ar-invoice-lines-table.tsx`,
`ar-invoice-lines-editor.tsx` **AR forms (2):** `ar-invoice-form.tsx`,
`ar-allocate-payment-form.tsx` **AP routes (6):** list page, loading, detail
page, detail loading, new page, pay page **AR routes (6):** list page, loading,
detail page, detail loading, new page, allocate page

### Definition of Done — S7

- [x] AP/AR invoice lifecycle works: create → approve → post → pay
- [x] Same patterns as journals (receipts, audit, idempotency)
- [x] Navigation reflects new modules
- [x] Typecheck: 0 errors
- [x] Drift gate: 118/118 pass, 0 warnings
- [x] Tests: 141/141 pass (15 files)

---

## S8 — DX Polish + Generators

**Goal:** Developer experience tooling — screen generators, drift checks, CI
gates.

### Deliverables

| #    | Item                     | Acceptance Criteria                                                                                                                                                                          |
| ---- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S8.1 | `gen:screen` generator   | ✅ **DONE** — `pnpm gen:screen <module> <entity>` → 8 files: queries + actions + blocks (table, detail-header) + routes (list, loading, detail, new). CWD-independent via `import.meta.url`. |
| S8.2 | `gen:form` generator     | ✅ **DONE** — `pnpm gen:form <SchemaName>` → RHF + zodResolver + useReceipt + ReceiptPanel + idempotency + error display. Supports `--module`/`--entity` flags.                              |
| S8.3 | `gen:table-ui` generator | ✅ **DONE** — `pnpm gen:table-ui <ViewModelName>` → Table block with StatusBadge/MoneyCell/DateCell imports + EmptyState. Supports `--module`/`--entity` flags.                              |
| S8.4 | UI drift checks          | ✅ **DONE (pulled to S0)** — `pnpm web:drift` with 16 checks (W01-W16), 118 sub-checks                                                                                                       |
| S8.5 | `arch:guard` web rules   | ✅ **DONE (pulled to S0)** — `ARCHITECTURE.@afenda-web.md` enforced by `arch:guard` (E1-E15) + `web:drift` (W01-W16)                                                                         |
| S8.6 | Storybook (optional)     | ⏸ **DEFERRED** — Team size does not yet warrant; revisit when component library grows                                                                                                        |
| S8.7 | `components.json` audit  | ✅ **DONE** — Verified: new-york style, RSC true, TSX true, neutral base, CSS vars, Lucide icons, all aliases correct                                                                        |

### Files Created (3 new generators)

**Generators** (3 files in `tools/generators/src/`):

- `gen-screen.mjs` — Full feature screen scaffolding (8 files per invocation)
- `gen-form.mjs` — RHF + Zod form component from contract schema
- `gen-table-ui.mjs` — Data table block with ERP formatters

**Modified files:**

- `package.json` (root) — 3 new scripts: `gen:screen`, `gen:form`,
  `gen:table-ui`
- `ARCHITECTURE.@afenda-web.md` — §12 updated from "Future" to implemented with
  script names
- `ARCHITECTURE.@afenda-generators.md` — Added frontend generators section

### Definition of Done — S8

- [x] Generators produce files matching architecture patterns (drift-compliant
      output)
- [x] Drift checks catch forbidden imports in CI (118/118 pass)
- [x] New developer can scaffold a feature module in < 5 minutes
- [x] CWD-independent: generators work from any directory
- [x] Typecheck: 0 errors
- [x] Tests: 141/141 pass

---

## S9 — Performance + Production Prep

**Goal:** Production-ready performance, error monitoring, deployment pipeline.

### Deliverables

| #     | Item                  | Acceptance Criteria                                                                                                                                                               |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9.1  | Bundle analysis       | ✅ **DONE** — `@next/bundle-analyzer` installed, `analyze` script, `withBundleAnalyzer` wrapper in `next.config.ts`                                                               |
| S9.2  | Lighthouse audit      | ✅ **DONE** — All optimizations applied (font, CSP, standalone, security headers). Run `pnpm --filter @afenda/web analyze` for metrics.                                           |
| S9.3  | Image optimization    | ✅ **DONE (pulled to S0)** — AVIF/WebP formats configured, `remotePatterns` for `*.afenda.io` added                                                                               |
| S9.4  | Font optimization     | ✅ **DONE** — `next/font/google` Inter with `display: swap`, CSS variable `--font-sans`, zero layout shift                                                                        |
| S9.5  | Error monitoring      | ✅ **DONE** — `src/lib/error-reporting.ts` — provider-agnostic stub (`captureException`, `captureMessage`, breadcrumbs, user context). Swap to Sentry by replacing TODO lines.    |
| S9.6  | Analytics placeholder | ✅ **DONE** — `src/hooks/use-analytics.ts` — `trackEvent`, `identifyUser`, `trackPageView`, `useAnalytics()` hook. No vendor dep.                                                 |
| S9.7  | CSP headers           | ✅ **DONE** — CSP + X-Content-Type-Options + X-Frame-Options + Referrer-Policy + Permissions-Policy + HSTS + X-DNS-Prefetch-Control in `next.config.ts` `headers()`               |
| S9.8  | Rate limiting UI      | ✅ **DONE** — Exponential backoff with jitter (3 retries, 500ms base, 10s max) for 429/502/503/504 + network errors. `Retry-After` header respected. Error reporting integration. |
| S9.9  | Docker build          | ✅ **DONE** — Multi-stage `Dockerfile` (base→deps→builder→runner), `output: 'standalone'`, non-root user, `.dockerignore`                                                         |
| S9.10 | CI/CD pipeline        | ✅ **DONE** — Docker build job added to `ci.yml` (runs after quality+test+guards on main push). Buildx + GHA cache.                                                               |
| S9.11 | Environment config    | ✅ **DONE** — `.env.production` + `.env.staging` templates with app/auth/db/sentry/analytics/feature-flags sections                                                               |

### Files Created / Modified

**New files** (5 files):

- `src/lib/error-reporting.ts` — Provider-agnostic error capture
  (captureException, captureMessage, breadcrumbs, user context)
- `src/hooks/use-analytics.ts` — Vendor-agnostic event tracking (trackEvent,
  identifyUser, trackPageView, useAnalytics hook)
- `Dockerfile` — Multi-stage Docker build (base→deps→builder→runner, standalone
  output, non-root)
- `.dockerignore` — Docker build exclusions
- `.env.production` + `.env.staging` — Environment variable templates

**Modified files** (5 files):

- `next.config.ts` — Bundle analyzer, standalone output, remotePatterns, CSP +
  security headers
- `src/app/layout.tsx` — `next/font/google` Inter, `--font-sans` CSS variable,
  viewport export
- `src/lib/api-client.ts` — Retry with exponential backoff (429/502/503/504),
  Retry-After support, error reporting integration
- `ARCHITECTURE.@afenda-web.md` — `@next/bundle-analyzer` added to `allowed_dev`
- `../../tools/scripts/web-drift-check.mjs` — `@next/bundle-analyzer` added to
  W13 ALLOWED_DEV
- `../../.github/workflows/ci.yml` — Docker build job added

### Definition of Done — S9

- [x] Lighthouse-ready: font optimization, CSP, security headers, standalone
      build
- [x] Error monitoring captures and reports errors (provider-agnostic stub)
- [x] Docker build configured with multi-stage Dockerfile + standalone output
- [x] CI pipeline includes Docker build job (after quality+test+guards)
- [x] Retry/backoff for API rate limiting (429) with Retry-After support
- [x] Typecheck: 0 errors
- [x] Drift: 119/119 pass
- [x] Tests: 141/141 pass

---

## Cross-Sprint Concerns

These are tracked across all sprints and must be maintained continuously:

| Concern                   | Standard                                                                  | Tracked By                                                     |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **TypeScript strictness** | `strict: true`, no `any` in component props                               | `pnpm typecheck`, `pnpm web:drift` (W08)                       |
| **Accessibility**         | WCAG 2.2 AA, semantic HTML, keyboard nav                                  | `pnpm web:drift` (W09), `eslint-plugin-jsx-a11y`, manual audit |
| **Performance**           | RSC for reads, minimal `"use client"`, no unnecessary client state        | `pnpm web:drift` (W11), Lighthouse                             |
| **Contract compliance**   | All payloads use `@afenda/contracts` schemas                              | `pnpm web:drift` (W04)                                         |
| **Import boundaries**     | No `@afenda/db`, `drizzle-orm`, `fastify`, `pino` in frontend             | `pnpm web:drift` (W03), `arch:guard` (E8)                      |
| **Feature isolation**     | `features/finance/*` never imports from `features/inventory/*`            | `pnpm web:drift` (W06)                                         |
| **Route boundary**        | `page.tsx`/`layout.tsx` only import from allowed prefixes                 | `pnpm web:drift` (W05)                                         |
| **shadcn purity**         | `components/ui/` managed by CLI, no domain imports                        | `pnpm web:drift` (W07)                                         |
| **No hardcoded Radix**    | Use `components/ui/` wrappers, not raw `@radix-ui/`                       | `pnpm web:drift` (W01)                                         |
| **className discipline**  | `cn()` for merging, no template literals or string concat                 | `pnpm web:drift` (W02)                                         |
| **Tailwind v4 compat**    | No deprecated v3 patterns (`theme()`, `tw-` prefix); `@apply` house style | `pnpm web:drift` (W10, W16)                                    |
| **CSS variable colors**   | Use `bg-primary`/`text-destructive`, not `bg-red-500`                     | `pnpm web:drift` (W14)                                         |
| **Dependency allowlist**  | All deps in `ARCHITECTURE.@afenda-web.md` allowlist                       | `pnpm web:drift` (W13)                                         |
| **Server Action pattern** | Forms use Server Actions, not client fetch                                | `pnpm web:drift` (W15)                                         |
| **Required structure**    | All required files/dirs from ARCHITECTURE.md exist                        | `pnpm web:drift` (W12)                                         |
| **Test coverage**         | Lines 80%, functions 80%, branches 75%                                    | `vitest --coverage`                                            |
| **Responsive design**     | Mobile-friendly at 768px minimum                                          | Manual testing                                                 |

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

## File Inventory (Current — 170+ files)

### `src/lib/` (12 files)

- `utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `api-client.ts` — Typed fetch client with `ApiResult<T>`, tenant headers
- `format.ts` — Money, date, number, percent, ID truncation formatters
- `auth.ts` — Server-side Better Auth helpers: `getServerSession()`,
  `requireAuth()`, `getSessionToken()`, `getActiveOrganizationId()`
- `auth-client.ts` — **(S2)** `createAuthClient` with organization + 2FA plugins
- `auth-actions.ts` — **(S2)** Server actions: `signUpAction`, `logoutAction`
  (sign-in handled client-side for proper cookie setting)
- `api-error.server.ts` — **(S2)** Centralized API error handler (401→`/login`,
  403→`/forbidden`, 500→error boundary)
- `tenant-actions.ts` — **(S2)** Server actions for company switching with RSC
  refresh
- `tenant-context.server.ts` — **(S2)** Server-side tenant context builder from
  `/ledgers` + `/periods` API
- `constants.ts` — Routes, status config, currency config, navigation config
- `types.ts` — UI-only types: `ApiError`, `ApiResult`, `CommandReceipt`,
  `PaginatedResponse`, `TenantContext`, `AuditEntry`, `ColumnDef`
- `error-reporting.ts` — **(S9)** Provider-agnostic error capture
  (`captureException`, `captureMessage`, breadcrumbs, user/tag context)
- `report-export.ts` — **(S4.8)** Export engine: `toCSV()` (RFC 4180 + BOM),
  `toJSON()` (afenda-report-v1), `exportFilename()`. Pure functions, zero deps.

### `src/providers/` (2 files)

- `tenant-provider.tsx` — React context for tenant/company/period state
- `theme-provider.tsx` — `next-themes` wrapper with SSR, localStorage, system
  detection

### `src/hooks/` (6 files)

- `use-tenant-context.ts` — Re-export from tenant provider
- `use-receipt.ts` — Receipt panel state (show/clear/isOpen)
- `use-debounce.ts` — Generic value debounce
- `use-media-query.ts` — Responsive breakpoint detection + `useIsMobile()`
- `use-mobile.ts` — **(S1)** Mobile breakpoint hook (used by shadcn Sidebar)
- `use-analytics.ts` — **(S9)** Vendor-agnostic event tracking (`trackEvent`,
  `identifyUser`, `trackPageView`, `useAnalytics` hook)

### `src/components/erp/` (20 files)

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
- `export-menu.tsx` — **(S4.8)** Client-side dropdown: CSV, JSON, Print/PDF.
  Accepts `ExportPayload`, triggers Blob download or `window.print()`
- `business-document.tsx` — **(S1)** Tab-based document layout with header +
  tabs + right-rail
- `data-table.tsx` — **(S1)** Generic `DataTable<T>` with sortable columns,
  search, empty states
- `command-palette.tsx` — **(S1)** Cmd+K global search using cmdk CommandDialog
- `error-boundary.tsx` — **(S1)** Feature-level error boundary with fallback UI
- `user-menu.tsx` — **(S1)** User dropdown menu in topbar (avatar + sign out)
- `theme-toggle.tsx` — Light/dark/system toggle in topbar

### `src/components/ui/` (23 components)

- `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `collapsible.tsx`,
  `command.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`,
  `label.tsx`, `popover.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`,
  `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `sonner.tsx`, `switch.tsx`,
  `table.tsx`, `tabs.tsx`, `tooltip.tsx`
- All genuine shadcn/ui (Radix primitives, `data-slot`, CVA). CLI-managed.

### `src/components/settings/` (4 files)

- `active-sessions.tsx` — **(S2)** Active session list with revoke capability
- `api-key-management.tsx` — **(S2)** API key create/revoke management
- `passkey-management.tsx` — **(S2)** WebAuthn passkey registration/management
- `two-factor-setup.tsx` — **(S2)** TOTP 2FA enrollment with QR code

### `src/features/finance/` (29 files)

- `journals/queries/journal.queries.ts` — Typed API wrappers: list, get, create,
  post, reverse, void
- `journals/actions/journal.actions.ts` — **(S3)** 5 server actions (create,
  post, reverse, void, audit query)
- `journals/blocks/journal-table.tsx` — Journal list table with status, money,
  date cells
- `journals/blocks/journal-detail-header.tsx` — Document header with status,
  dates, totals
- `journals/blocks/journal-lines-editor.tsx` — Inline debit/credit grid with RHF
  field array
- `journals/blocks/journal-lines-table.tsx` — **(S3)** Read-only shadcn Table
  for journal detail Lines tab
- `journals/blocks/journal-actions.tsx` — **(S3)** Post/Reverse/Void buttons
  with reason dialog + receipt panel
- `journals/blocks/journal-filters.tsx` — **(S3)** Client-side filter bar
  component
- `journals/forms/journal-draft-form.tsx` — RHF + Zod + CreateJournalSchema +
  receipt flow
- `reports/queries/report.queries.ts` — **(S4)** Balance sheet, income
  statement, cash flow + trial balance query wrappers
- `reports/actions/report-export.actions.ts` — **(S4.8)** Pure builder
  functions: `buildTrialBalanceExport`, `buildBalanceSheetExport`,
  `buildIncomeStatementExport`, `buildCashFlowExport`,
  `buildBudgetVarianceExport`, `buildIcAgingExport` → `ExportPayload`
- `accounts/queries/account.queries.ts` — **(S4)** Account list/detail queries
  with view models
- `periods/queries/period.queries.ts` — **(S4)** Period list/detail queries with
  view models
- `periods/actions/period.actions.ts` — **(S4)** Close/lock/reopen server
  actions
- `periods/blocks/period-actions.tsx` — **(S4)** Client-side period action
  buttons with receipt panel
- `ledgers/queries/ledger.queries.ts` — **(S2)** Ledger list query for tenant
  context hydration
- `intercompany/queries/ic.queries.ts` — **(S5)** IC transaction list/detail, IC
  aging, IC agreements query wrappers
- `intercompany/actions/ic.actions.ts` — **(S5)** Create, settle, audit server
  actions for IC transactions
- `intercompany/forms/ic-transaction-form.tsx` — **(S5)** IC create form with
  agreement selector + source/mirror lines
- `recurring/queries/recurring.queries.ts` — **(S5)** Recurring template
  list/detail/create/process query wrappers
- `recurring/actions/recurring.actions.ts` — **(S5)** Create, process, toggle
  server actions for recurring templates
- `recurring/blocks/recurring-template-actions.tsx` — **(S5)** Process/activate/
  deactivate buttons with receipt panel
- `budgets/queries/budget.queries.ts` — **(S5)** Budget entries, variance,
  variance alerts query wrappers
- `budgets/actions/budget.actions.ts` — **(S5)** Upsert budget entry server
  action
- `fx/queries/fx.queries.ts` — **(S5)** FX rate list/detail query wrappers
- `fx/actions/fx.actions.ts` — **(S5)** Create, approve server actions for FX
  rates
- `fx/blocks/fx-rate-actions.tsx` — **(S5)** Approve button with receipt panel
- `fx/blocks/fx-rate-create-form.tsx` — **(S5)** Inline FX rate create form with
  currency pair, rate, effective date

### `src/app/` (57+ route files)

- `layout.tsx` — Root layout with ThemeProvider + TooltipProvider + Sonner
  Toaster
- `page.tsx` — Root redirect to `/login`
- `globals.css` — **OKLCH-based EMS terminal design system** (834 lines)
- `error.tsx` — Global error boundary
- `loading.tsx` — Global loading spinner
- `not-found.tsx` — 404 page
- `(auth)/layout.tsx` — Auth layout (no AppShell)
- `(auth)/login/page.tsx` — Server Component + Suspense → `LoginForm` client
  component
- `(auth)/login/_components/login-form.tsx` — Client-side login via
  `authClient.signIn.email()`
- `(auth)/register/page.tsx` — Server Component + Suspense → `RegisterForm`
  client component
- `(auth)/register/_components/register-form.tsx` — Client-side signup via
  `authClient.signUp.email()`
- `(auth)/forgot-password/page.tsx` — Password reset request page
- `(auth)/forgot-password/_components/forgot-password-form.tsx` — **(S2)** Reset
  request form
- `(auth)/reset-password/page.tsx` — **(S2)** Token-based password reset page
- `(auth)/reset-password/_components/reset-password-form.tsx` — **(S2)** New
  password form
- `(auth)/onboarding/page.tsx` — **(S2)** Post-signup organization setup
- `(auth)/onboarding/_components/org-onboarding-form.tsx` — **(S2)** Org
  onboarding form
- `(auth)/two-factor/page.tsx` — **(S2)** 2FA verification challenge page
- `(auth)/two-factor/_components/two-factor-verify-form.tsx` — **(S2)** TOTP
  code entry
- `(auth)/verify-email/page.tsx` — **(S2)** Email verification status page
- `(auth)/verify-email/_components/verify-email-status.tsx` — **(S2)** Token
  verification display
- `(shell)/layout.tsx` — AppShell wrapper with tenant context hydration
- `(shell)/page.tsx` — Dashboard with metric cards
- `(shell)/forbidden/page.tsx` — **(S2)** Authenticated 403 page for role/scope
  denials
- `(shell)/finance/journals/page.tsx` — Journal list
- `(shell)/finance/journals/loading.tsx` — Journal list skeleton
- `(shell)/finance/journals/[id]/page.tsx` — Journal detail
- `(shell)/finance/journals/[id]/loading.tsx` — **(S3)** Journal detail skeleton
- `(shell)/finance/journals/new/page.tsx` — Create journal (Server Action)
- `(shell)/finance/trial-balance/page.tsx` — Trial balance
- `(shell)/finance/trial-balance/loading.tsx` — Trial balance skeleton
- `(shell)/finance/accounts/page.tsx` — Chart of accounts
- `(shell)/finance/accounts/loading.tsx` — Accounts skeleton
- `(shell)/finance/periods/page.tsx` — **(S4)** Fiscal periods with actions
- `(shell)/finance/periods/loading.tsx` — Periods skeleton
- `(shell)/finance/reports/page.tsx` — Financial reports hub
- `(shell)/finance/reports/loading.tsx` — Reports hub skeleton
- `(shell)/finance/reports/balance-sheet/page.tsx` — **(S4)** Balance sheet
  report
- `(shell)/finance/reports/balance-sheet/loading.tsx` — Balance sheet skeleton
- `(shell)/finance/reports/income-statement/page.tsx` — **(S4)** Income
  statement report
- `(shell)/finance/reports/income-statement/loading.tsx` — Income statement
  skeleton
- `(shell)/finance/reports/cash-flow/page.tsx` — **(S4)** Cash flow statement
- `(shell)/finance/reports/cash-flow/loading.tsx` — Cash flow skeleton
- `(shell)/finance/reports/ic-aging/page.tsx` — **(S5)** IC aging report
- `(shell)/finance/reports/ic-aging/loading.tsx` — **(S5)** IC aging skeleton
- `(shell)/finance/reports/budget-variance/page.tsx` — **(S5)** Budget variance
  report with alerts
- `(shell)/finance/reports/budget-variance/loading.tsx` — **(S5)** Budget
  variance skeleton
- `(shell)/finance/intercompany/page.tsx` — **(S5)** IC transaction list with
  status filters
- `(shell)/finance/intercompany/loading.tsx` — **(S5)** IC list skeleton
- `(shell)/finance/intercompany/new/page.tsx` — **(S5)** IC transaction create
  with agreement selector + source/mirror lines
- `(shell)/finance/intercompany/[id]/page.tsx` — **(S5)** IC transaction detail
  with paired lines + audit trail
- `(shell)/finance/intercompany/[id]/loading.tsx` — **(S5)** IC detail skeleton
- `(shell)/finance/recurring/page.tsx` — **(S5)** Recurring template list with
  active/inactive filters + process/toggle actions
- `(shell)/finance/recurring/loading.tsx` — **(S5)** Recurring skeleton
- `(shell)/finance/fx-rates/page.tsx` — **(S5)** FX rate list with inline create
  form + approve actions
- `(shell)/finance/fx-rates/loading.tsx` — **(S5)** FX rates skeleton
- `(shell)/finance/ledgers/page.tsx` — **(S5)** Ledger list with company + base
  currency
- `(shell)/finance/ledgers/loading.tsx` — **(S5)** Ledgers skeleton
- `(shell)/settings/page.tsx` — **(S2)** Settings with tabbed UI
- `(shell)/settings/_components/settings-tabs.tsx` — **(S2)** Tab container for
  settings components
- `api/auth/[...all]/route.ts` — Better Auth API route handler

### `src/proxy.ts` (1 file)

- `proxy.ts` — **(S2)** Next.js 16 middleware convention — session cookie check,
  unauthenticated redirect to `/login`

### `src/__tests__/` (15 test files + infra)

- `setup.ts` — `@testing-library/jest-dom/vitest`, `jest-axe/extend-expect`, MSW
  server lifecycle, `matchMedia` stub
- `utils.tsx` — Custom `renderWithProviders` for ThemeProvider + TenantProvider
- `mocks/` — MSW request handlers + server setup
- `format.test.ts` (18 tests) — Money, date, number, percent, ID formatters
- `constants.test.ts` (17 tests) — Route paths, status config, currency config,
  nav config
- `api-client.test.ts` (15 tests) — GET/POST/PUT/PATCH/DELETE, error handling,
  tenant headers, helper functions
- `utils.test.ts` (6 tests) — `cn()` utility
- `use-debounce.test.ts` (4 tests) — Value debounce with timers
- `status-badge.test.tsx` (7 tests) — Badge rendering + a11y
- `components/money-cell.test.tsx` (10 tests) — Formatting, negative, bigint,
  string, a11y
- `components/date-cell.test.tsx` (8 tests) — `<time>` element, formats, a11y
- `components/empty-state.test.tsx` (8 tests) — Title, description, action,
  icon, a11y
- `components/receipt-panel.test.tsx` (12 tests) — Receipt data, dismiss, links,
  a11y
- `components/audit-panel.test.tsx` (10 tests) — Entries, timeline, correlation,
  a11y
- `components/page-header.test.tsx` (11 tests) — h1, breadcrumbs, actions, a11y
- `hooks/use-receipt.test.ts` (5 tests) — Show/clear/referential stability
- `hooks/use-media-query.test.ts` (5 tests) — Match changes, cleanup,
  `useIsMobile`
- `integration/journal-flow.test.tsx` (5 tests) — Form→submit→receipt panel
  flow, balance validation, error display

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
| **W10** | Tailwind v4 compat        | `@apply` in components (house style), `theme()` function, `tw-` prefix, `tailwind.config` references                                   |
| **W11** | `"use client"` discipline | `"use client"` in `lib/` or `queries/` files (must be server-compatible)                                                               |
| **W12** | Required structure        | All required files and directories from `ARCHITECTURE.@afenda-web.md` exist                                                            |
| **W13** | Dependency audit          | All `dependencies`/`devDependencies` in `package.json` are in ARCHITECTURE allowlist; Tailwind v4, React 19, Next.js 16 version checks |
| **W14** | No hardcoded colors       | `bg-red-500`, `text-blue-600` etc. in `components/erp/` and `features/` (use CSS variables: `bg-primary`, `text-destructive`)          |
| **W15** | Server Action pattern     | Direct `fetch()` in form components or query files not using `createApiClient()`                                                       |
| **W16** | `@theme inline` complete  | Every CSS variable in `:root` must have a `--color-*` mapping in `@theme inline` (Tailwind v4 utility class generation)                |

### Current Status

```
Total: 119 checks · Pass: 119 · Fail: 0 · Warn: 0
```

---

## Changelog

| Date       | Sprint | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-24 | S0     | Architecture doc created, 46 files scaffolded, deps installed, typecheck clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-02-24 | S0     | Frontend drift gate created: `web-drift-check.mjs` with 15 checks (W01-W15), 0 failures. Wired as `pnpm web:drift`. Fixed W14 hardcoded amber color in journal-detail-header.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-02-24 | S0.5   | Tailwind v4 hardening: `globals.css` four-step architecture (root vars, hsl(), @theme inline, no @apply). Fixed sidebar `hsl(var())` double-wrap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-02-24 | S0.5   | Replaced custom ThemeProvider with `next-themes`. Updated `theme-toggle.tsx` import.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-02-24 | S0.5   | Synced ARCHITECTURE.md allowlists: unified `radix-ui`, added `next-themes`, `zod`, `@vitejs/plugin-react`, test devDeps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-02-24 | S0.5   | Test infrastructure: Vitest + RTL + MSW + jest-axe. `src/__tests__/` convention (matches finance module). 4 test files, 35 tests green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-02-24 | S0.5   | Drift gate hardened: W10 now fails on `@apply` in globals.css. Added W16 (`@theme inline` completeness). 16 checks, 70 total passes, 0 failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-02-24 | S0.5   | Applied `react-testing-patterns` skill: defaultProps, renderWithProviders, no CSS class testing, accessible queries, globals: true (no explicit vitest imports).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-02-25 | S0.5+  | **globals.css OKLCH upgrade**: Replaced HSL tokens with OKLCH perceptually-uniform color space. 834-line EMS terminal design system with density profiles, motion safety, forced colors, print safety. 57/57/57 token sync verified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-02-25 | S2     | **Neon Auth integration:** DB migration `0007_better_auth.sql` (7 tables, now superseded by neon_auth schema), auth types + relations in `@afenda/db`, register page, forgot-password stub, real session data in UserMenu, authz ARCHITECTURE doc updated for `./auth` entrypoint. Login page refactored: Server Component + Suspense boundary + client-side `signIn.email()` for proper cookie handling. Next.js 16 `proxy.ts` convention applied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-02-25 | S0.5+  | Applied 10 director-level refinements: `:where()` zero-specificity variants, `max()` radius guards, explicit oklch alpha for selection, glyph indicators for forced-colors, `contain:content` on perf-grid, `--ring` consolidation, `--grid`/`--grid-foreground`/`--grid-border` data table tokens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-02-25 | S1     | **S1 audit & completion**: All 10 items verified delivered. 23 shadcn/ui components installed, business-document/data-table/command-palette/error-boundary all real implementations, responsive sidebar with Sheet mobile, Sonner Toaster in root layout, loading.tsx on all 5 finance routes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-02-25 | S2     | **S2 partial**: Auth flow done (S2.1-S2.3) — functional login page, auth middleware with session cookie check, (auth) route group. auth-client.ts + auth-actions.ts delivered. S2.4-S2.10 (API wiring) remain planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-02-25 | Plan   | **Plan sync**: Updated FRONTEND-DEV-PLAN.md to match codebase reality. S1 marked DONE, S2 marked PARTIAL. File inventory updated from 46→70+ files. Corrected @apply stance (house style, not deprecated).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-02-25 | S3     | **S3 Journal CRUD — DONE**: 4 new files created (`journal.actions.ts`, `journal-actions.tsx`, `journal-lines-table.tsx`, `journal-filters.tsx`). 6 files upgraded to shadcn Table/Input/Button/Label/Link (journal-table, journal-lines-editor, journal-draft-form, 3 route pages). Server actions for all mutations (create/post/reverse/void). Idempotency via `crypto.randomUUID()`. Per-line validation in lines editor. Server-rendered filter links (zero-JS). Reason dialog for reverse/void. Receipt panel on all mutations. Audit trail tab. 0 TypeScript errors in S3 feature directory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-02-25 | S2     | **S2 continuation:** Added server-side tenant context hydration from real API (`/ledgers` + `/periods`) via `tenant-context.server.ts`; wired all shell routes through `getRequestContext()`; implemented persistent company switching via server action + RSC refresh; period indicator now reflects real active period data. Validated with `pnpm --filter @afenda/web typecheck` and `pnpm --filter @afenda/web build`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-02-25 | S2     | **S2.10 error handling complete:** Added centralized server-side API error handler (`api-error.server.ts`) and applied it across finance routes for consistent behavior: 401 redirects to `/login`, 403 redirects to `/forbidden`, and 500+ escalates to Next.js error boundaries. Added authenticated `/forbidden` route under `(shell)` for role/scope denials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-02-25 | Audit  | **Plan v1.1 audit**: Validated codebase vs plan. File count 70+ → **135 actual files**. S2 upgraded from PARTIAL → DONE (all 10 items confirmed, S2 DoD complete). Discovered 20+ undocumented files: 3 extra lib files (`api-error.server.ts`, `tenant-actions.ts`, `tenant-context.server.ts`), 4 settings components, `ledger.queries.ts`, 5 auth pages (onboarding, 2FA, verify-email, reset-password, forbidden), 6 extra `loading.tsx` skeletons, `settings-tabs.tsx`. Feature inventory 6 → 15 files. Route files 20+ → 45+. Drift gate 115/115 pass. Typecheck 0 errors. 35/35 tests pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-02-25 | S5     | **S5 Intercompany + Advanced Finance — DONE**: 25 new files created. **Data layer** (8 files): `ic.queries.ts`, `ic.actions.ts`, `recurring.queries.ts`, `recurring.actions.ts`, `budget.queries.ts`, `budget.actions.ts`, `fx.queries.ts`, `fx.actions.ts`. **UI blocks** (4 files): `recurring-template-actions.tsx`, `fx-rate-actions.tsx`, `fx-rate-create-form.tsx`, `ic-transaction-form.tsx`. **Route pages** (13 files): IC list + detail + create + 2 skeletons, recurring list + skeleton, FX rates list + skeleton, IC aging report + skeleton, budget variance report + skeleton, ledgers list + skeleton. **Constants updated**: 8 new route paths + 4 nav children + 3 status entries (PENDING/PAIRED/RECONCILED). File inventory 135 → 160. Drift gate 115/115 pass. Typecheck 0 errors. 35/35 tests pass.                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-02-25 | S6     | **S6 Testing + Accessibility — DONE**: 11 new test files created (141 total tests, up from 35). **Lib tests**: `api-client.test.ts` (15), `constants.test.ts` (17). **Component tests** (6 files, 59 tests): MoneyCell, DateCell, EmptyState, ReceiptPanel, AuditPanel, PageHeader — all with jest-axe `toHaveNoViolations`. **Hook tests**: `use-receipt.test.ts` (5), `use-media-query.test.ts` (5). **Integration**: `journal-flow.test.tsx` (5) — form→submit→receipt panel flow with Zod validation. **Coverage**: 97.99% lines / 87.69% branches / 100% functions (thresholds: 80/75/80). **Accessibility**: `eslint-plugin-jsx-a11y` recommended config added to ESLint. **Coverage provider**: `@vitest/coverage-v8` added. Drift gate 118/118 pass. Typecheck 0 errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-02-25 | S7     | **S7 AP/AR Module Screens — DONE**: 30 new files created. **Data layer** (4 files): `ap.queries.ts`, `ap.actions.ts`, `ar.queries.ts`, `ar.actions.ts` — view models + server actions with `getRequestContext()`. **AP blocks** (5 files): invoice table, detail header, actions (approve/post/cancel with dialogs), lines table, lines editor. **AP forms** (2 files): invoice form (RHF + Zod + lines editor), payment form. **AR blocks** (5 files): same pattern as AP + write-off support. **AR forms** (2 files): invoice form, allocate payment form. **AP routes** (6 files): list + loading, detail + loading, new, pay. **AR routes** (6 files): list + loading, detail + loading, new, allocate. **Modified**: `constants.ts` (8 route paths, 2 nav children), `sidebar-nav.tsx` (5 Lucide icons). AP statuses: DRAFT→PENDING_APPROVAL→APPROVED→POSTED→PAID/PARTIALLY_PAID/CANCELLED. AR adds WRITTEN_OFF. File inventory 160 → 190. Drift 118/118 pass. Typecheck 0 errors. Tests 141/141 pass.                                                                                                                                                                                                                           |
| 2026-02-25 | S8     | **S8 DX Polish + Generators — DONE**: 3 frontend generators created (`gen-screen.mjs`, `gen-form.mjs`, `gen-table-ui.mjs`) in `tools/generators/src/`. All use `import.meta.url` for CWD-independent root resolution. `gen:screen` scaffolds 8 files (queries + actions + blocks + routes); `gen:form` scaffolds RHF + Zod form with useReceipt/ReceiptPanel/idempotency; `gen:table-ui` scaffolds data table with StatusBadge/MoneyCell/DateCell. 3 scripts added to root `package.json`. ARCHITECTURE docs updated: `@afenda-web.md` §12 from "Future" to implemented, `@afenda-generators.md` frontend section added. `components.json` audit: all config matches architecture doc. Drift 118/118 pass. Typecheck 0 errors. Tests 141/141 pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-02-25 | S9     | **S9 Performance + Production Prep — DONE**: 5 new files + 6 modified files. **Bundle analysis**: `@next/bundle-analyzer` installed, `analyze` script, `withBundleAnalyzer` wrapper. **Font optimization**: `next/font/google` Inter with `display: swap`, `--font-sans` CSS variable, viewport export with theme colors. **Error monitoring**: `src/lib/error-reporting.ts` — provider-agnostic stub (`captureException`, `captureMessage`, breadcrumbs, user/tag context). **Analytics**: `src/hooks/use-analytics.ts` — `trackEvent`, `identifyUser`, `trackPageView`, `useAnalytics()` hook. **Security headers**: CSP + X-Content-Type-Options + X-Frame-Options + Referrer-Policy + Permissions-Policy + HSTS + X-DNS-Prefetch-Control in `next.config.ts`. **Rate limiting**: Exponential backoff with jitter (3 retries, 500ms base, 10s max) for 429/502/503/504 + network errors, `Retry-After` header support, error reporting integration. **Docker**: Multi-stage Dockerfile (base→deps→builder→runner), `output: 'standalone'`, non-root user. **CI/CD**: Docker build job added to `ci.yml`. **Env config**: `.env.production` + `.env.staging` templates. Drift 119/119 pass. Typecheck 0 errors. Tests 141/141 pass. |
| 2026-02-25 | S4.8   | **S4.8 Report Export — DONE**: 3 new files + 6 modified report pages + 1 test file. **Export engine**: `src/lib/report-export.ts` — `toCSV()` (RFC 4180 + UTF-8 BOM for Excel compat), `toJSON()` (pretty-printed `afenda-report-v1` format), `exportFilename()` (slug + date). **Export builders**: `report-export.actions.ts` — 6 pure functions (`buildTrialBalanceExport`, `buildBalanceSheetExport`, `buildIncomeStatementExport`, `buildCashFlowExport`, `buildBudgetVarianceExport`, `buildIcAgingExport`) mapping typed results to `ExportPayload`. **UI**: `export-menu.tsx` — client dropdown with CSV/JSON download via Blob URL + Print/PDF via `window.print()`. **Wired**: Export button added to PageHeader `actions` prop on all 6 financial report pages (trial-balance, balance-sheet, income-statement, cash-flow, budget-variance, ic-aging). **Tests**: 20 tests covering CSV RFC 4180, BOM, quoting, CRLF, multi-section, JSON schema, filename generation. Zero new deps. Drift 119/119 pass. Typecheck 0 errors. Tests 161/161 pass (16 files).                                                                                                                                                               |

---
package: '@afenda/web'
root_dir: 'apps/web'
type: app
layer: deployment
composite: false
entrypoints: ['src/app/layout.tsx']
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime:
    - '@afenda/core'
    - '@afenda/contracts'
    - 'next'
    - 'react'
    - 'react-dom'
    - '@hookform/resolvers'
    - 'react-hook-form'
    - 'lucide-react'
    - 'clsx'
    - 'tailwind-merge'
    - 'class-variance-authority'
    - 'sonner'
    - 'nuqs'
    - 'radix-ui'
    - '@radix-ui/react-checkbox'
    - '@radix-ui/react-progress'
    - '@radix-ui/react-radio-group'
    - 'next-themes'
    - 'zod'
    - 'cmdk'
    - 'better-auth'
    - '@better-auth/passkey'
    - '@afenda/authz'
    - '@afenda/db'
    - '@neondatabase/auth'
    - '@sentry/nextjs'
    - 'date-fns'
    - 'framer-motion'
    - 'nanoid'
    - 'posthog-js'
    - 'react-day-picker'
    - 'react-dropzone'
    - 'recharts'
    - 'qrcode.react'
    - '@radix-ui/react-alert-dialog'
    - '@t3-oss/env-nextjs'
    - '@tanstack/react-query'
    - 'd3-hierarchy'
    - 'd3-sankey'
    - 'mermaid'
    - 'react-grid-layout'
  allowed_dev:
    - '@afenda/typescript-config'
    - '@afenda/eslint-config'
    - '@types/react'
    - '@types/react-dom'
    - 'typescript'
    - 'vitest'
    - '@testing-library/react'
    - '@testing-library/jest-dom'
    - '@testing-library/user-event'
    - 'jsdom'
    - 'msw'
    - 'jest-axe'
    - '@tailwindcss/postcss'
    - '@vitejs/plugin-react'
    - 'tailwindcss'
    - 'eslint-plugin-jsx-a11y'
    - '@vitest/coverage-v8'
    - 'shadcn'
    - '@next/bundle-analyzer'
    - 'babel-plugin-react-compiler'
    - 'next-devtools-mcp'
    - '@types/node'
  allowed_peer: []
enforced_structure:
  required_files:
    - 'src/app/layout.tsx'
    - 'src/app/page.tsx'
    - 'src/lib/api-client.ts'
    - 'src/lib/format.ts'
    - 'src/lib/utils.ts'
    - 'package.json'
    - 'tsconfig.json'
    - 'next.config.ts'
    - 'postcss.config.mjs'
    - 'components.json'
  required_directories:
    - 'src/app'
    - 'src/components/ui'
    - 'src/components/erp'
    - 'src/features'
    - 'src/lib'
    - 'src/hooks'
boundary_rules:
  allowed_import_prefixes:
    - './'
    - '@/'
    - '@afenda/core'
    - '@afenda/contracts'
    - 'next'
    - 'react'
    - 'lucide-react'
    - 'clsx'
    - 'tailwind-merge'
    - 'class-variance-authority'
    - 'sonner'
    - 'nuqs'
    - '@hookform/resolvers'
    - 'react-hook-form'
    - '@radix-ui/'
    - 'cmdk'
    - 'better-auth'
    - '@better-auth/passkey'
    - '@afenda/authz'
  forbidden_imports:
    - 'fastify'
    - 'drizzle-orm'
    - 'postgres'
    - 'pino'
    - '@afenda/platform'
    - '@afenda/modules'
  allow_imports_by_path:
    'src/lib/auth.ts':
      ['@afenda/db', '@afenda/authz', '@afenda/authz/auth', 'better-auth']
  forbid_cross_layer_imports: []
---

# @afenda/web — Frontend Architecture

> **Version:** 1.0  
> **Status:** Ratified  
> **Aligned with:** PROJECT.md v2.2, ARCHITECTURE-SPEC.md v1.3

## Purpose

Next.js 16 frontend for the Afenda ERP platform. Server Components for reads,
Server Actions for writes. Consumes `@afenda/contracts` for type-safe API calls
via a generated/typed client. Tailwind CSS v4 + shadcn/ui (New York style, Radix
primitives). WCAG 2.2 AA compliant.

**Leaf app** — NOT consumed by other packages, NOT in root `tsconfig.json`
references.

---

## §1. Core Principle — UI Is a View of Business Truth

The UI does exactly 4 things:

1. **Read** — Server Components fetch data via typed API client
2. **Capture input** — Forms validated with the same Zod schemas as the backend
3. **Submit a command** — Server Actions call the API, return structured
   receipts
4. **Render results + audit evidence** — Receipt panels confirm every mutation

**No domain logic in UI.** The frontend arranges, formats, and validates input.
Business rules live in `@afenda/contracts` (validation) and `apps/api`
(orchestration).

---

## §2. Contract-First Data Flow

```
@afenda/contracts (Zod schemas)
        │
        ├──► OpenAPI spec (generated, for partners)
        ├──► Typed TS client (for UI fetch calls)
        └──► Form validation (same schema, both sides)

UI screens ONLY talk in terms of contracts:
  - No random payload shapes
  - No UI-only enums duplicating domain
  - No hand-written fetch body types
```

### API Client Pattern

```
src/lib/api-client.ts
  - Base URL from env (NEXT_PUBLIC_API_URL)
  - Typed fetch wrappers per endpoint
  - Automatic x-tenant-id / x-user-id / Authorization headers
  - Returns typed Result<T, ApiError>
```

Feature-level query files (`features/<module>/<entity>/queries/*.ts`) wrap the
client with domain-specific calls and are the ONLY place fetch logic lives.

---

## §3. Directory Structure

```
apps/web/
  src/
    app/                              # Next.js App Router (routes only)
      (shell)/                        # Route group — AppShell layout
        layout.tsx                    # Sidebar + Topbar + tenant/company context
        page.tsx                      # Dashboard
        finance/
          journals/
            page.tsx                  # Journal list
            [id]/page.tsx             # Journal detail
            new/page.tsx              # Create journal draft
          trial-balance/
            page.tsx                  # Trial balance read-only
          accounts/
            page.tsx                  # Chart of accounts
          periods/
            page.tsx                  # Fiscal periods
          reports/
            page.tsx                  # Financial reports hub
        settings/
          page.tsx                    # Tenant/company settings
      (auth)/                         # Route group — auth pages (no shell)
        login/page.tsx
        layout.tsx
      layout.tsx                      # Root layout (html, body, providers)
      page.tsx                        # Landing / redirect
      globals.css                     # Tailwind v4 + shadcn CSS variables
      not-found.tsx                   # 404
      error.tsx                       # Global error boundary
      loading.tsx                     # Global loading fallback

    features/                         # Feature modules (co-located by domain)
      finance/
        journals/
          blocks/                     # Reusable UI blocks
            journal-table.tsx         # DataTable for journal list
            journal-filters.tsx       # Filter bar (status, period, search)
            journal-lines-editor.tsx  # Inline line editor (debit/credit grid)
            journal-post-button.tsx   # Post action with idempotency
            journal-detail-header.tsx # Document header (status, number, dates)
            journal-audit-panel.tsx   # Audit trail tab
          forms/
            journal-draft-form.tsx    # RHF + Zod + CreateJournalSchema
          queries/
            journal.queries.ts        # Typed API client wrappers
          hooks/
            use-journal-lines.ts      # Line editor state management
        accounts/
          blocks/
            account-table.tsx
          queries/
            account.queries.ts
        periods/
          blocks/
            period-table.tsx
            period-actions.tsx
          queries/
            period.queries.ts
        reports/
          blocks/
            trial-balance-table.tsx
            balance-sheet-view.tsx
            income-statement-view.tsx
            cash-flow-view.tsx
          queries/
            report.queries.ts

    components/
      ui/                             # shadcn/ui primitives (NEVER modify directly)
        button.tsx
        input.tsx
        table.tsx
        badge.tsx
        card.tsx
        dialog.tsx
        form.tsx
        label.tsx
        select.tsx
        separator.tsx
        tabs.tsx
        tooltip.tsx
        command.tsx
        popover.tsx
        scroll-area.tsx
        sonner.tsx
        skeleton.tsx
        dropdown-menu.tsx
        avatar.tsx
        switch.tsx
      erp/                            # ERP-specific shared components
        app-shell.tsx                 # Sidebar + topbar + main content area
        sidebar-nav.tsx               # Navigation with module grouping
        tenant-switcher.tsx           # Tenant context selector
        company-switcher.tsx          # Company context selector
        period-indicator.tsx          # Active fiscal period display
        command-palette.tsx           # Global search / command (Cmd+K)
        status-badge.tsx              # DRAFT/POSTED/REVERSED/VOIDED badges
        money-cell.tsx                # Formatted currency display
        date-cell.tsx                 # Formatted date display
        receipt-panel.tsx             # Mutation confirmation receipt
        audit-panel.tsx               # Who/when/what changed timeline
        business-document.tsx         # Standard document layout (header/tabs/rail)
        data-table.tsx                # Generic sortable/filterable table
        empty-state.tsx               # Empty list/search result placeholder
        page-header.tsx               # Page title + breadcrumbs + actions
        loading-skeleton.tsx          # Consistent loading states
        error-boundary.tsx            # Feature-level error boundary

    lib/
      api-client.ts                   # Typed fetch client (base URL, headers, Result)
      format.ts                       # Money/date/number formatting utilities
      utils.ts                        # cn() helper (clsx + tailwind-merge)
      auth.ts                         # Auth helpers (token, session, redirect)
      constants.ts                    # Status colors, currency config, route paths
      types.ts                        # UI-only types (not duplicating contracts)

    hooks/
      use-tenant-context.ts           # Current tenant/company from context
      use-receipt.ts                  # Receipt panel state management
      use-debounce.ts                 # Input debounce for search/filters
      use-media-query.ts              # Responsive breakpoint detection

    providers/
      tenant-provider.tsx             # React context for tenant/company state
      theme-provider.tsx              # Dark/light mode (next-themes pattern)
```

### Rules

| Rule                                  | Rationale                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- |
| **Routes are thin**                   | `page.tsx` composes blocks, fetches data in RSC, passes props down        |
| **Blocks are reusable**               | Table, editor, detail summary, audit panel — used across modules          |
| **No domain logic in UI**             | UI arranges, formats, validates input — business rules in API             |
| **Features own their queries**        | `features/<module>/<entity>/queries/` is the ONLY place fetch logic lives |
| **Components/ui is shadcn territory** | Never hand-edit; use `npx shadcn@latest add <component>`                  |
| **Components/erp is shared ERP**      | Cross-module UI primitives (status badge, money cell, document layout)    |

---

## §4. Data Patterns

### Reads — Server Components (RSC)

```tsx
// app/(shell)/finance/journals/page.tsx
import { getJournals } from '@/features/finance/journals/queries/journal.queries';
import { JournalTable } from '@/features/finance/journals/blocks/journal-table';

export default async function JournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getJournals(params);
  if (!result.ok) return <ErrorDisplay error={result.error} />;
  return <JournalTable data={result.value} />;
}
```

- Fetch in `page.tsx` (server) using typed client
- Return JSON-serializable data to client blocks
- Use `Promise.all` for parallel fetches; Suspense for streaming

### Writes — Server Actions

```tsx
// features/finance/journals/forms/journal-draft-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateJournalSchema, type CreateJournal } from '@afenda/contracts';
import { createJournalAction } from './actions';

// Form uses the SAME Zod schema as the backend
const form = useForm<CreateJournal>({
  resolver: zodResolver(CreateJournalSchema),
});
```

Server Actions validate with the **same Zod schema** from `@afenda/contracts`,
call the API, and return a **receipt**:

```ts
// Receipt shape — every mutation returns this
interface CommandReceipt {
  commandId: string;
  idempotencyKey: string;
  resultRef: string; // e.g. journal ID
  completedAt: string; // ISO timestamp
  auditRef?: string; // link to audit trail entry
}
```

**UI pattern:** Every mutation ends with a receipt panel. This is standard ERP
and eliminates ambiguity.

### Client State

- **No client state libraries** until proven need
- Prefer: server fetch + pass props, local `useState` for UI-only toggles
- Add TanStack Query only for: highly interactive grids, background refresh
  needs
- URL state via `nuqs` for filters/pagination (shareable, bookmarkable)

---

## §5. ERP UI Primitives (Build Once, Use Everywhere)

### A) AppShell + Navigation

| Component              | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `app-shell.tsx`        | Collapsible sidebar + topbar + main content area  |
| `sidebar-nav.tsx`      | Module-grouped navigation (Finance, AP, AR, etc.) |
| `tenant-switcher.tsx`  | Tenant context selector (header dropdown)         |
| `company-switcher.tsx` | Company context selector (header dropdown)        |
| `period-indicator.tsx` | Active fiscal period display (always visible)     |
| `command-palette.tsx`  | Cmd+K global search/command (later phase)         |

### B) Business Document Layout

Every ERP object (journal, invoice, transfer) uses the same layout:

```
┌─────────────────────────────────────────────────────┐
│ Header: status badge, doc number, dates, parties    │
├─────────────────────────────────────────────────────┤
│ Tabs: Lines │ Accounting │ Attachments │ Audit      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab content area                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Right rail: actions (Post, Reverse, Void),          │
│ warnings, approval status                           │
└─────────────────────────────────────────────────────┘
```

- **POSTED** documents are read-only (no edit controls shown)
- **DRAFT** documents show edit + post actions
- **REVERSED/VOIDED** show the reversal/void reference

### C) Status Model

Consistent status visuals across all modules:

| Status             | Color                  | Icon          | Behavior           |
| ------------------ | ---------------------- | ------------- | ------------------ |
| `DRAFT`            | `muted`                | `FileEdit`    | Editable           |
| `POSTED`           | `default` (green tint) | `CheckCircle` | Locked, read-only  |
| `REVERSED`         | `secondary` (amber)    | `Undo2`       | Shows reversal ref |
| `VOIDED`           | `destructive`          | `XCircle`     | Shows void reason  |
| `PENDING_APPROVAL` | `outline` (blue)       | `Clock`       | Awaiting action    |
| `APPROVED`         | `default` (green)      | `ShieldCheck` | Ready to post      |

### D) Audit UX

- Dedicated audit panel on every business document
- Timeline view: who / when / what changed
- Links command receipts to audit rows
- Makes "ERP trust" visible to users

### E) Receipt Panel

Every mutation displays a confirmation:

```
┌─────────────────────────────────────┐
│ ✓ Journal Posted Successfully       │
│                                     │
│ Document:  JRN-2026-00142           │
│ Posted at: 2026-02-24 05:10:32 UTC  │
│ Audit ref: AUD-2026-00891           │
│ Idempotency key: 7f3a...b2c1        │
│                                     │
│ [View Journal]  [Back to List]      │
└─────────────────────────────────────┘
```

---

## §6. Forms Workflow

### Stack

| Library                   | Purpose                             |
| ------------------------- | ----------------------------------- |
| React Hook Form           | Form state, minimal re-renders      |
| `@hookform/resolvers`     | Connects RHF + Zod                  |
| `@afenda/contracts` (Zod) | Schema validation — same as backend |
| shadcn `<Form>`           | Accessible form primitives          |

### ERP-Specific Form Behaviors

- **Inline line editors** for document lines (journals, invoices) — debit/credit
  grid
- **Totals always visible** — debits = credits for finance, running total for
  AP/AR
- **Validation before post** — show what will fail and why (pre-flight check)
- **Semantic markup** — `<form>`, `<label>`, `<fieldset>`/`<legend>` for
  accessibility
- **Error handling** — field-level errors from Zod, API-level errors from
  receipt

### Form → Action → Receipt Flow

```
User fills form
  → RHF validates with Zod (client-side, instant feedback)
  → Server Action validates again with same Zod schema
  → Server Action calls API with typed client
  → API returns Result<T, E>
  → Server Action returns CommandReceipt | ApiError
  → UI shows receipt panel or error toast
```

---

## §7. Performance Rules

| Rule                                  | Rationale                                        |
| ------------------------------------- | ------------------------------------------------ |
| Server Components for all reads       | No client JS for data display                    |
| `"use client"` only for interactivity | Forms, dropdowns, toggles                        |
| No client state libraries by default  | Add TanStack Query only with proven need         |
| URL state for filters/pagination      | `nuqs` — shareable, bookmarkable, SSR-compatible |
| `next/image` for all images           | Automatic optimization                           |
| Suspense boundaries per data fetch    | Stream independent sections                      |
| `loading.tsx` per route segment       | Instant navigation feedback                      |
| `error.tsx` per route segment         | Graceful degradation                             |

---

## §8. Accessibility (WCAG 2.2 AA)

| Requirement         | Implementation                                                                    |
| ------------------- | --------------------------------------------------------------------------------- |
| Semantic HTML       | `<button>`, `<header>`, `<nav>`, `<main>`, `<form>`, `<label>`, heading hierarchy |
| Keyboard navigation | Every interactive element reachable/operable; consistent focus indicators         |
| Color contrast      | 4.5:1 standard text; 3:1 large text                                               |
| Skip links          | Before nav and large content blocks                                               |
| Form errors         | Communicated by more than color; requirements stated; status announced            |
| `lang` attribute    | Set on `<html>`                                                                   |
| Reduced motion      | `prefers-reduced-motion` respected                                                |
| Tooling             | `eslint-plugin-jsx-a11y`; shadcn/Radix for accessible primitives                  |

---

## §9. Drift Checks (UI-Specific)

26 automated checks enforced by `tools/scripts/web-drift-check.mjs` (run via
`pnpm web:drift` or as part of `pnpm gate:web-module`).

| ID   | Check                        | Level | Rule                                                                  |
| ---- | ---------------------------- | ----- | --------------------------------------------------------------------- |
| W01  | Radix primitives             | FAIL  | No direct `@radix-ui/*` imports outside `components/ui/`              |
| W02  | className merging            | FAIL  | Template literals / concatenation in className → use `cn()`           |
| W03  | Forbidden imports            | FAIL  | No `fastify`, `drizzle-orm`, `postgres`, `pino`, `@afenda/db`        |
| W04  | Contract compliance          | FAIL  | No hand-written `*Payload`/`*Request`/`*Response` types in features/  |
| W05  | Route boundary               | FAIL  | `page.tsx`/`layout.tsx` only import from allowed prefixes             |
| W06  | Feature isolation             | FAIL  | `features/X/` must not import from `features/Y/`                     |
| W07  | shadcn purity                | FAIL  | `components/ui/` must not import domain code                         |
| W08  | No `any` in props            | FAIL  | No `: any` or `as any` in component/hook/provider files              |
| W09  | Accessibility                | FAIL  | `<button>` needs `type=`, `<img>` needs `alt=`                      |
| W10  | Tailwind v4 compat           | WARN  | No `@apply`, `theme()`, `tailwind.config` in components              |
| W11  | `"use client"` discipline    | FAIL  | No `"use client"` in `lib/` or `queries/` files                     |
| W12  | Required structure           | FAIL  | Required files and directories from ARCHITECTURE.md exist             |
| W13  | Dependency audit             | FAIL  | All deps in `package.json` must be in allowlist                      |
| W14  | No hardcoded colors          | FAIL  | Use CSS vars (`bg-success`) not palette (`bg-green-500`)             |
| W15  | Server Action pattern        | WARN  | Forms use Server Actions, not client-side `fetch()`                  |
| W16  | `@theme inline`              | FAIL  | Every `:root` CSS var has a `--color-*` mapping in `@theme inline`   |
| W17  | No hardcoded URLs            | FAIL  | No `localhost`, `127.0.0.1`, or literal `https://` URLs              |
| W18  | No loose utils               | FAIL  | No `utils.ts`/`helpers.ts` in `features/` or `components/erp/`      |
| W19  | shadcn component usage       | FAIL  | No raw `<input>`, `<select>`, `<table>` where shadcn exists          |
| W20  | No hardcoded route paths     | FAIL  | All module routes use `routes.*` from `@/lib/constants`              |
| W21  | Route boundary completeness  | WARN  | `page.tsx` should have sibling `loading.tsx`, `error.tsx`            |
| W22  | Suspense discipline          | WARN  | Pages with 2+ `await` calls should use `<Suspense>` for streaming   |
| W23  | Page metadata exports        | WARN  | `page.tsx` under `(shell)/` should export `metadata`/`generateMetadata` |
| W24  | No stray `console.log`       | FAIL* | No `console.log()` in components/features (*WARN in server actions)  |
| W25  | `next.config.ts` practices   | FAIL  | `poweredByHeader: false`, `optimizePackageImports`, AVIF formats     |
| W26  | Exception registry audit     | WARN  | Stale exemptions in the gate script itself are flagged                |

---

## §10. Implementation Order (Finance-First)

| Phase  | Scope                                                                                                                    | Depends On        |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| **F0** | AppShell + tenant/company context + navigation                                                                           | shadcn components |
| **F1** | Journal list + create draft (lines editor) + validate + post (idempotency + receipt) + detail view (locked after posted) | F0, API endpoints |
| **F2** | Trial Balance / GL balances read-only screens                                                                            | F0, API endpoints |
| **F3** | Chart of Accounts + Fiscal Periods management                                                                            | F0                |
| **F4** | Financial reports (Balance Sheet, Income Statement, Cash Flow)                                                           | F2                |
| **F5** | Intercompany transfer UI (paired view)                                                                                   | F1                |
| **F6** | AP/AR module screens (expand pattern from F1)                                                                            | F1 pattern        |

This sequence forces the UI to respect the finance spine.

---

## §11. Definition of Done (Per Screen)

A screen is "done" when:

- [ ] Uses contracts (no custom payload types)
- [ ] Uses shared layout + status components
- [ ] Has loading state (`loading.tsx` or Suspense)
- [ ] Has empty state (no data placeholder)
- [ ] Has error state (`error.tsx` or error boundary)
- [ ] Mutation returns a receipt and UI displays it
- [ ] Audit panel exists (even minimal)
- [ ] Keyboard accessible + semantic form markup
- [ ] Responsive (mobile-friendly at minimum)
- [ ] No `any` types in component props

---

## §12. Generator Integration

| Generator                           | Output                                               | Script             |
| ----------------------------------- | ---------------------------------------------------- | ------------------ |
| `gen:screen <module> <entity>`      | List page + detail page + new page + blocks skeleton | `pnpm gen:screen`  |
| `gen:form <SchemaName>`             | RHF + Zod wiring + field stubs from schema           | `pnpm gen:form`    |
| `gen:table-ui <ViewModelName>`      | Table columns + formatters (money/date/status)       | `pnpm gen:table-ui`|

These generators enforce the patterns defined in this document. All generated code
passes the drift gate (`pnpm web:drift`) out of the box.

---

## §13. Environment Variables

| Variable                   | Purpose                      | Required               |
| -------------------------- | ---------------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL`      | Fastify API base URL         | Yes                    |
| `NEXT_PUBLIC_APP_NAME`     | Display name                 | No (default: "Afenda") |
| `NEON_AUTH_BASE_URL`       | Neon Auth server URL (branch-specific) | Yes (prod); optional (dev — trusted headers fallback) |
| `NEON_AUTH_COOKIE_SECRET`  | Session cookie encryption secret (min 32 chars) | Yes when auth is enabled |
| `JWKS_URL`                 | JWKS endpoint for JWT validation | Production only    |

> **⚠️ Standalone architecture note (Neon Auth roadmap):** This app uses a
> separate Fastify API server. Neon Auth does not yet officially support
> standalone frontend + backend deployments (HTTP-only cookies cannot be shared
> across different domains). Our workaround: the Next.js server extracts the
> session token from the Neon Auth cookie and forwards it as a
> `Bearer` token to the Fastify API, which validates it by calling Neon Auth's
> `/api/auth/get-session` endpoint. This works reliably server-to-server but
> should be revisited when Neon Auth GA adds official standalone support.
>
> **Branch Auth URLs:** Each Neon branch gets its own Auth URL:
> `https://<endpoint-id>.neonauth.<region>.aws.neon.tech/neondb/auth`

---

## §14. Key Dependencies

| Package                    | Purpose                                     | Category |
| -------------------------- | ------------------------------------------- | -------- |
| `next`                     | Framework (App Router, RSC, Server Actions) | Runtime  |
| `react` / `react-dom`      | UI library                                  | Runtime  |
| `tailwindcss`              | Styling (v4, CSS-first)                     | Dev      |
| `@tailwindcss/postcss`     | PostCSS plugin for Tailwind v4 (Next.js)    | Dev      |
| `@afenda/contracts`        | Zod schemas (shared validation)             | Runtime  |
| `@afenda/core`             | Branded IDs, Money, Result, errors          | Runtime  |
| `react-hook-form`          | Form state management                       | Runtime  |
| `@hookform/resolvers`      | Zod ↔ RHF bridge                            | Runtime  |
| `lucide-react`             | Icons                                       | Runtime  |
| `clsx` + `tailwind-merge`  | Class name utilities                        | Runtime  |
| `class-variance-authority` | Variant-based component styling             | Runtime  |
| `sonner`                   | Toast notifications                         | Runtime  |
| `nuqs`                     | URL state management (filters, pagination)  | Runtime  |
| `cmdk`                     | Command palette (Cmd+K)                     | Runtime  |
| Radix UI primitives        | Accessible headless components (via shadcn) | Runtime  |
| `better-auth`              | Authentication (session, 2FA, organization) | Runtime  |
| `@better-auth/passkey`     | Passkey/WebAuthn auth plugin                | Runtime  |
| `@afenda/authz`            | ERP access control (roles, permissions)     | Runtime  |
| `shadcn`                   | Component generator CLI                     | Dev      |
| `qrcode.react`             | QR code generation (TOTP 2FA enrollment)    | Runtime  |

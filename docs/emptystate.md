# Enterprise Empty State — Implementation Plan v2

> **Version:** 2.0 **Updated:** 2026-02-27
> **Status:** Ready to implement
> **Scope:** `apps/web/src/` — 45 empty state instances across 4 inconsistent patterns

---

## Problem Statement

The current `EmptyState` system has **45 instances** split across **4 incompatible patterns**, with every string hardcoded at the call site:

| Pattern | Count | Example |
|---|---|---|
| **A. Standalone `<EmptyState>`** (early tables: AP, AR, journals, portal) | 17 | `<EmptyState title="No payable invoices found" description="Create your first..." icon={Receipt} />` |
| **B. DataTable `emptyState={{}}` config** (newer gen'd tables) | 12 | `emptyState={{ icon: FileCheck, title: 'No covenants defined', description: '...' }}` |
| **C. DataTable flat props** (`emptyMessage=` / `emptyTitle=`) | 7 | `emptyMessage="No journals match your search."` |
| **D. Inline ad-hoc** (`<p>`, `<TableCell>`) | 9 | `<p className="text-sm text-muted-foreground">No users found.</p>` |

**Total: 45 call sites, 0 consistency, 0 content governance.**

---

## Design Principles

1. **Variants are semantic, not visual** — `firstRun` / `noResults` / `error` / `forbidden` represent _meaning_; styling is derived
2. **Registry-first, i18n later** — typed message registry in code (i18n-ready shape); swap to `next-intl` is a mechanical change in a future phase
3. **DataTable owns the decision** — single `emptyState` prop; variant auto-inferred from active search/filters
4. **Motion is internal** — centralized inside the component, respects reduced motion, `animate` prop for tests
5. **CI-enforced** — grep gate prevents hardcoded strings from creeping back

---

## Steps

### Phase 0 — Foundation (Types + Registry)

#### Step 1: Create the type system

Create `apps/web/src/components/erp/empty-state.types.ts`:

```ts
import type * as React from 'react';

// ─── Semantic Variants ───────────────────────────────────────────────────────

/** Represents meaning, not styling. Styling is derived from the variant. */
export type EmptyStateVariant = 'firstRun' | 'noResults' | 'error' | 'forbidden';

/** sm = inline/table cells, md = card/panel (default), lg = full-page */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

// ─── Content Contract ────────────────────────────────────────────────────────

export interface EmptyStateContent {
  title: string;
  description?: string;
  ctaLabel?: string;
}

// ─── Registry Key (curated string union) ─────────────────────────────────────

export type EmptyStateKey =
  // Finance — GL
  | 'finance.journals'
  | 'finance.accounts'
  | 'finance.ledgers'
  | 'finance.periods'
  | 'finance.trialBalance'
  | 'finance.recurring'
  // Finance — Sub-ledgers
  | 'finance.payables'
  | 'finance.payables.suppliers'
  | 'finance.payables.paymentRuns'
  | 'finance.payables.whtCerts'
  | 'finance.payables.holds'
  | 'finance.receivables'
  // Finance — FX & IC
  | 'finance.fxRates'
  | 'finance.intercompany'
  // Finance — Reports
  | 'finance.reports.trialBalance'
  | 'finance.reports.balanceSheet'
  | 'finance.reports.incomeStatement'
  | 'finance.reports.cashFlow'
  | 'finance.reports.budgetVariance'
  | 'finance.reports.icAging'
  // Finance — Extended domains
  | 'finance.tax.codes'
  | 'finance.tax.returns'
  | 'finance.tax.whtCerts'
  | 'finance.fixedAssets'
  | 'finance.leases'
  | 'finance.intangibles'
  | 'finance.expenses.claims'
  | 'finance.projects'
  | 'finance.treasury.covenants'
  | 'finance.treasury.icLoans'
  | 'finance.credit.holds'
  | 'finance.credit.customers'
  | 'finance.costAccounting.drivers'
  | 'finance.costAccounting.allocations'
  | 'finance.approvals'
  | 'finance.banking.statements'
  // Portal
  | 'portal.invoices'
  | 'portal.payments'
  | 'portal.documents'
  | 'portal.disputes'
  | 'portal.whtCerts'
  | 'portal.bankAccounts'
  // Admin & Settings
  | 'admin.users'
  | 'admin.audit'
  | 'admin.members'
  | 'settings.auditLog';

// ─── Component Props ─────────────────────────────────────────────────────────

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Semantic variant — drives default icon, color accent, and tone. */
  variant?: EmptyStateVariant;
  /** Size — sm (inline/table), md (card/panel), lg (full-page). */
  size?: EmptyStateSize;
  /** Registry key — resolves title/description/ctaLabel from the registry. */
  contentKey?: EmptyStateKey;
  /** Direct title override (takes precedence over registry). */
  title?: string;
  /** Direct description override. */
  description?: string;
  /** Override the variant's default icon. */
  icon?: React.ElementType;
  /** Action slot rendered below the description (e.g. a CTA button). */
  action?: React.ReactNode;
  /** Disable entrance animation (useful in tests). Defaults to true. */
  animate?: boolean;
}
```

Default icon mapping per variant:
- `firstRun` → `Sparkles`
- `noResults` → `Search`
- `error` → `AlertTriangle`
- `forbidden` → `ShieldX`

#### Step 2: Create the typed message registry

Create `apps/web/src/components/erp/empty-state.registry.ts`:

- `Record<EmptyStateKey, Partial<Record<EmptyStateVariant, EmptyStateContent>>>`
- All 45 entities × relevant variants (primarily `firstRun` + `noResults`)
- `getEmptyStateContent(key, variant)` — resolves content with safe fallback + dev-only warning for missing keys
- **This is the only file in the codebase that contains empty-state strings**

```ts
import type { EmptyStateKey, EmptyStateContent, EmptyStateVariant } from './empty-state.types';

type RegistryEntry = Partial<Record<EmptyStateVariant, EmptyStateContent>>;

const registry: Record<EmptyStateKey, RegistryEntry> = {
  // ─── Finance — GL ────────────────────────────────────────────────────────
  'finance.journals': {
    firstRun: {
      title: 'No journal entries yet',
      description: 'Create your first journal entry to get started.',
      ctaLabel: 'Create Journal',
    },
    noResults: {
      title: 'No journals match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },
  'finance.accounts': {
    firstRun: {
      title: 'No accounts configured',
      description: 'Set up your chart of accounts to begin.',
      ctaLabel: 'Add Account',
    },
    noResults: {
      title: 'No accounts match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },
  // ... all remaining keys follow the same pattern
};

export function getEmptyStateContent(
  key: EmptyStateKey,
  variant: EmptyStateVariant = 'firstRun',
): EmptyStateContent {
  const entry = registry[key];
  const content = entry?.[variant] ?? entry?.firstRun;
  if (!content) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[EmptyState] Missing registry entry: ${key}.${variant}`);
    }
    return { title: 'No data', description: 'No results found.' };
  }
  return content;
}
```

**i18n-ready shape:** When `next-intl` is introduced later, `getEmptyStateContent` swaps its implementation to `useTranslations('emptyState')` — call sites don't change.

---

### Phase 1 — The Component + DataTable Contract

#### Step 3: Redesign EmptyState component

Rewrite `apps/web/src/components/erp/empty-state.tsx`:

- **cva-driven sizing** (replaces hardcoded `h-10 w-10`, `py-12`):
  - `sm`: `py-6`, icon `h-6 w-6`, `text-xs` — inline/table cells
  - `md`: `py-10`, icon `h-8 w-8`, `text-sm` — standard card/panel (default)
  - `lg`: `py-16`, icon `h-12 w-12`, `text-base` — full-page
- **Variant visual accents** (subtle, derived from semantic meaning):
  - `firstRun`: icon `text-primary/40` — warm, encouraging
  - `noResults`: icon `text-muted-foreground/50` — neutral, calm
  - `error`: icon `text-destructive/60` — attention, retry
  - `forbidden`: icon `text-muted-foreground/30` — cool gray
- **Motion is internal**: `motion.div` with staggered children from `lib/motion.ts`. `useReducedMotion()` respected. `animate` prop defaults to `true`, disable in tests.
- **Registry integration**: If `contentKey` passed → resolve via `getEmptyStateContent(key, variant)`. Direct `title`/`description` overrides take precedence (backward compat escape hatch).
- **Accessibility**: `role="status"`, `aria-hidden` on icon, `aria-live="polite"` for dynamic states.

#### Step 4: Fix DataTable empty-state contract (the big win)

Redesign `EmptyStateConfig` in `data-table.tsx`:

```ts
type EmptyStateConfig =
  | {
      key: EmptyStateKey;
      variant?: EmptyStateVariant;
      size?: EmptyStateSize;
      action?: React.ReactNode;
      icon?: React.ElementType;
    }
  | {
      title: string;
      description?: string;
      variant?: EmptyStateVariant;
      size?: EmptyStateSize;
      action?: React.ReactNode;
      icon?: React.ElementType;
    }; // legacy escape hatch
```

DataTable behavior:
- Single `emptyState?: EmptyStateConfig` prop
- **Auto-infer variant**: active search/filters → `noResults`; else → `firstRun`
- Keep legacy flat props (`emptyTitle`, `emptyMessage`, `emptyIcon`, `emptyAction`) with `process.env.NODE_ENV === 'development'` console warning
- This eliminates 70% of inconsistency — tables stop hand-rolling "No X found"

#### Step 5: Update barrel exports

Add `EmptyStateVariant`, `EmptyStateSize`, `EmptyStateKey`, `EmptyStateContent` type exports to `components/erp/index.ts`.

---

### Phase 2 — Content Migration (Kill All Hardcoded Strings)

#### Step 6: Migrate DataTable-based call sites (19 tables)

Replace `emptyState={{ title: "...", description: "..." }}` and `emptyMessage="..."` with `emptyState={{ key: 'finance.xxx' }}`:

| File | Key |
|---|---|
| `covenants-table.tsx` | `finance.treasury.covenants` |
| `ic-loans-table.tsx` | `finance.treasury.icLoans` |
| `assets-table.tsx` | `finance.fixedAssets` |
| `tax-codes-table.tsx` | `finance.tax.codes` |
| `wht-certificates-table.tsx` | `finance.tax.whtCerts` |
| `leases-table.tsx` | `finance.leases` |
| `tax-returns-table.tsx` | `finance.tax.returns` |
| `projects-table.tsx` | `finance.projects` |
| `intangibles-table.tsx` | `finance.intangibles` |
| `claims-table.tsx` | `finance.expenses.claims` |
| `credit-holds-table.tsx` | `finance.credit.holds` |
| `customer-credits-table.tsx` | `finance.credit.customers` |
| `cost-drivers-table.tsx` | `finance.costAccounting.drivers` |
| `allocation-runs-table.tsx` | `finance.costAccounting.allocations` |
| `statements-table.tsx` | `finance.banking.statements` |
| `approvals-table.tsx` | `finance.approvals` |
| `account-table.tsx` | `finance.accounts` |
| `journal-table.tsx` (DataTable call) | `finance.journals` |
| `period-table.tsx` | `finance.periods` |
| `ledger-table.tsx` | `finance.ledgers` |
| `fx-rate-table.tsx` | `finance.fxRates` |
| `ic-transaction-table.tsx` | `finance.intercompany` |
| `recurring-template-table.tsx` | `finance.recurring` |

#### Step 7: Migrate standalone EmptyState call sites (17 uses)

Replace `<EmptyState title="..." description="..." icon={...} />` with `<EmptyState contentKey="finance.xxx" icon={...} />`:

| File | Key |
|---|---|
| `ap-invoice-table.tsx` | `finance.payables` |
| `ap-supplier-table.tsx` | `finance.payables.suppliers` |
| `ap-payment-run-table.tsx` | `finance.payables.paymentRuns` |
| `ap-wht-certificate-table.tsx` | `finance.payables.whtCerts` |
| `ap-hold-table.tsx` | `finance.payables.holds` |
| `ar-invoice-table.tsx` | `finance.receivables` |
| `journal-table.tsx` (standalone) | `finance.journals` |
| `portal-invoice-table.tsx` | `portal.invoices` |
| `portal-payment-table.tsx` | `portal.payments` |
| `portal-document-table.tsx` | `portal.documents` |
| `portal-dispute-table.tsx` | `portal.disputes` |
| `portal-wht-table.tsx` | `portal.whtCerts` |
| `portal-bank-account-list.tsx` | `portal.bankAccounts` |
| 6 report `page.tsx` files | `finance.reports.*` |
| 6 finance `page.tsx` files | `finance.accounts` / `.ledgers` / `.periods` / `.fxRates` / `.intercompany` / `.recurring` |

#### Step 8: Replace inline ad-hoc empty states (9 call sites)

| File | Current | New |
|---|---|---|
| `users-table.tsx` | `<p>No users found.</p>` | `<EmptyState contentKey="admin.users" variant="noResults" size="sm" />` |
| `global-audit-table.tsx` | `<p>No audit entries found.</p>` | `<EmptyState contentKey="admin.audit" variant="noResults" size="sm" />` |
| `portal-recon-results.tsx` | `<p>No items in this category.</p>` | `<EmptyState variant="noResults" size="sm" title="No items in this category" />` |
| `income-statement/page.tsx` | inline "No accounts in this section." | `<EmptyState variant="noResults" size="sm" title="No accounts in this section" />` |
| `balance-sheet/page.tsx` | inline "No accounts in this section." | same |
| `payment-runs/[id]/page.tsx` | "No items added yet..." | `<EmptyState variant="firstRun" size="sm" title="No items added yet" description="Add invoices to this payment run." />` |
| `payment-runs/[id]/items/page.tsx` | "No items added yet..." | `<EmptyState variant="firstRun" size="sm" title="No items added yet" description="Use the invoice selector below to add invoices." />` |
| `members-table.tsx` | inline pattern | `<EmptyState contentKey="admin.members" size="sm" />` |
| `audit-log-table.tsx` | inline pattern | `<EmptyState contentKey="settings.auditLog" size="sm" />` |

#### Step 9: Update code generators

Modify `gen-table-ui.mjs` and `gen-screen.mjs` to emit:

```tsx
<EmptyState contentKey="<module>.<entity>" icon={FileText} action={...} />
```

instead of hardcoded strings.

---

### Phase 3 — Enforcement & Testing

#### Step 10: Add CI grep gate

Add enforcement script (or add to `web-drift-check.mjs`) that flags hardcoded empty-state strings in `apps/web/src/**` **except** inside `empty-state.registry.ts` and `__tests__/`:

```bash
grep -rn --include='*.tsx' --include='*.ts' \
  -e 'No .* found' -e 'Nothing to show' -e 'Get started' -e 'No data' \
  apps/web/src/ \
  | grep -v 'empty-state.registry.ts' \
  | grep -v '__tests__/'
```

Any matches → CI fails. Prevents regressions.

#### Step 11: Update tests

Rewrite `empty-state.test.tsx` — **contract-focused, not pixel-focused**:

- Each variant renders correct `role="status"` + ARIA, passes `jest-axe`
- Each size applies expected cva classes (snapshot the wrapper)
- `getEmptyStateContent('finance.payables', 'firstRun')` returns expected content
- Unknown key → dev warning + generic fallback (not a crash)
- DataTable infers `firstRun` when no search active, `noResults` when filters active
- Backward-compat: direct `title`/`description` override still works
- `animate={false}` path renders without crashing
- `useReducedMotion` path renders correctly
- Don't over-test Framer Motion internals

#### Step 12: Drift gate update

Add check to `web-drift-check.mjs`:
- Every `<EmptyState` usage has a `contentKey` or explicit `variant` (no raw `title` without `contentKey`)
- Zero hardcoded strings outside registry

---

## Verification Checklist

- [ ] `pnpm tsc --noEmit` — zero TypeScript errors
- [ ] `pnpm --filter @afenda/web test` — all empty-state tests pass
- [ ] `pnpm --filter @afenda/web lint` — no ESLint violations
- [ ] CI grep gate — zero hardcoded empty-state strings outside registry
- [ ] Dev server — each variant × size renders correctly
- [ ] Motion plays on mount, respects `prefers-reduced-motion`
- [ ] `grep -r "No .* found" apps/web/src/ | grep -v registry | grep -v __tests__` returns zero

---

## Gold Standard End State

| Criterion | Target |
|---|---|
| One `EmptyState` component | Single component: variant / size / contentKey |
| One DataTable empty-state API | `emptyState={{ key, variant? }}` |
| Zero hardcoded strings at call sites | All content in registry |
| Typed registry (i18n-ready shape) | `getEmptyStateContent(key, variant)` |
| CI guard prevents regressions | Grep gate in drift check |
| Generators emit registry pattern | `gen-table-ui` + `gen-screen` updated |

---

## Key Decisions

| Decision | Rationale |
|---|---|
| **Registry-first, not i18n-first** | `next-intl` is cross-cutting churn (root layout, middleware, server/client boundaries). Registry has i18n-ready shape; swap is mechanical later. |
| **Semantic variants (4)** | `firstRun`, `noResults`, `error`, `forbidden` — represent meaning, not styling. Enterprise SaaS needs all four. |
| **cva for sizing** | Already used in shadcn components; type-safe variant mapping, no magic values. |
| **DataTable auto-infers variant** | Active search → `noResults`; empty data → `firstRun`. Eliminates 70% of inconsistency. |
| **Backward-compat shim** | Legacy flat props work with dev warning. Prevents big-bang migration. |
| **`animate` prop** | Defaults `true`, disable in tests. Motion stays internal — no bespoke motion at call sites. |
| **CI grep gate over ESLint** | Simpler, faster, catches the exact problem. Upgrade to custom ESLint rule later if needed. |

---

## Migration Order (no big-bang)

1. **Steps 1–2**: Types + Registry (zero breaking changes)
2. **Step 3**: New EmptyState component (backward-compat via `title`/`description` override)
3. **Step 4**: DataTable contract upgrade (legacy props still work + dev warning)
4. **Steps 6–8**: Migrate call sites iteratively (search-driven, can be batched)
5. **Step 9**: Update generators last (so new code doesn't regress)
6. **Steps 10–12**: Enforcement + tests (lock it down)

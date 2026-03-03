## Plan: Empty State Layout Constraint System

**TL;DR** — Replace the current 3-size (`sm`/`md`/`lg`) system with a **6-tier constraint** system modeled on grid-unit notation. Each tier encodes what content elements are allowed, what spacing/font/icon sizes apply, and whether borders/animation are shown — eliminating per-consumer `className` overrides. The `constraint` prop replaces `size` as a breaking change. KPI card custom inline rendering is removed in favor of `<EmptyState constraint="1x1">`.

---

**Steps**

### 1. Define the 6 Constraint Tiers

Add a new `EmptyStateConstraint` type in empty-state.types.ts with these tiers:

| Tier | Grid Unit | Containers | Shows | Padding | Icon | Title | Desc | CTA | Border | Animation |
|------|-----------|------------|-------|---------|------|-------|------|-----|--------|-----------|
| `1x1` | 1 col × 1 row | KPI cards (compact `min-h-[100px]`) | icon + title | `py-3 gap-1.5` | `h-5 w-5` | `text-xs` | hidden | hidden | `border-0` | false |
| `1x2` | 1 col × 2 row | Popovers (w-80/w-96), shell widgets, dialogs | icon + title + desc | `py-6 gap-2` | `h-5 w-5` | `text-xs` | `text-xs` | hidden | `border-0` | false |
| `2x1` | 2 col × 1 row | Dashboard blocks (activity-feed, quick-actions, attention) | icon + title + desc | `py-6 gap-2` | `h-6 w-6` | `text-sm` | `text-xs` | optional | dashed | true |
| `2x2` | 2 col × 2 row | Charts, diagrams (bento `min-h-[292px]`) | icon + title + desc + CTA | `py-8 gap-3` | `h-8 w-8` | `text-sm` | `text-sm` | visible | dashed | true |
| `table` | full-width × h-48 | DataTable `<TableCell>` (192px) | icon + title + desc + CTA | `py-8 gap-3` | `h-8 w-8` | `text-sm` | `text-sm` | visible | dashed | true |
| `page` | full-width × flex | Report placeholders, full-page empty states | icon + title + desc + CTA | `py-16 gap-4` | `h-12 w-12` | `text-base` | `text-sm` | dashed | true |

### 2. Rewrite CVA Variants in empty-state.tsx

Replace the 4 separate CVA definitions (`emptyStateVariants`, `iconVariants`, `titleVariants`, `descriptionVariants`) to use `constraint` instead of `size`:

- **`emptyStateVariants`**: Map each constraint tier → padding, gap, border visibility, and `max-w` for description
- **`iconVariants`**: Map constraint tier × variant → icon size and color
- **`titleVariants`**: Map constraint tier → font size
- **`descriptionVariants`**: Map constraint tier → font size + visibility (`hidden` for `1x1`)

Add a new compound variant for border:
- `1x1` and `1x2` → remove `border border-dashed` from base, apply `border-0`
- All others keep `border border-dashed`

### 3. Update `EmptyStateProps` in empty-state.types.ts

- Add `constraint?: EmptyStateConstraint` prop with JSDoc for each tier
- **Deprecate** `size` prop (mark `@deprecated` with `console.warn` in dev mode, map `sm→1x1`, `md→2x2`, `lg→page` as fallback for transition)
- The component logic: `constraint` wins; if only `size` is provided, map it to the closest tier and warn

### 4. Add Content Visibility Logic

Inside the `EmptyState` component, derive what renders based on the constraint tier:

```
const CONSTRAINT_SLOTS = {
  '1x1': { icon: true, title: true, description: false, action: false },
  '1x2': { icon: true, title: true, description: true,  action: false },
  '2x1': { icon: true, title: true, description: true,  action: true  },
  '2x2': { icon: true, title: true, description: true,  action: true  },
  'table': { icon: true, title: true, description: true,  action: true  },
  'page': { icon: true, title: true, description: true,  action: true  },
}
```

This ensures consumers can pass `description` and `action` props but they're only rendered when the tier allows it — preventing overflow in tight containers.

### 5. Remove KPI Card Inline Empty State Rendering

In kpi-card.tsx:
- Remove the `resolvedEmpty` logic and the custom `<div className="flex flex-col gap-2 py-2">` rendering
- Replace with `<EmptyState constraint="1x1" contentKey={catalog.emptyState.registryKey} action={ctaButton} />`
- The `1x1` constraint will enforce icon+title only, matching the compact card's `min-h-[100px]`
- Move `ctaHref` into an `action` prop (which `1x1` hides by design — if you want the CTA to show in KPI, upgrade to `2x1`)

### 6. Migrate Popover/Shell Empty States

In these files, replace `size="sm" className="border-0 py-8"` with `constraint="1x2"`:

- notification-center.tsx — `constraint="1x2"`
- module-nav-popover.tsx — `constraint="1x2"`
- shortcut-popover.tsx — `constraint="1x2"`
- afenda-status-cluster.tsx — `constraint="1x2"`
- needs-attention.tsx — `constraint="1x2"`

All `className="border-0 py-8"` overrides become unnecessary — the tier handles it.

### 7. Migrate Dashboard Block Empty States

- activity-feed.tsx — `size="sm"` → `constraint="2x1"`
- quick-actions.tsx — `size="sm"` → `constraint="2x1"`
- attention-panel.tsx — `constraint="2x1"`

### 8. Migrate Chart/Bento Empty States

Any chart component that falls back to `<EmptyState>` when no data is present → `constraint="2x2"`. Specifically target chart wrappers where the empty state replaces the chart container.

### 9. Migrate DataTable Empty State Config

In data-table.tsx:
- The `EmptyStateConfig` type: add `constraint?: EmptyStateConstraint` field
- Default `constraint` to `'table'` when rendering inside `<TableCell className="h-48">`
- Remove explicit `size` from `EmptyStateConfig`

### 10. Migrate Report/Full-Page Empty States

All ~14 report pages (balance-sheet/(erp)/finance/financial-reports/reports/balance-sheet/page.tsx#L57), trial-balance/(erp)/finance/general-ledger/trial-balance/page.tsx#L59), etc.) → `constraint="page"`

### 11. Update Animation Logic

Refine the `shouldAnimate` logic:
- `1x1` and `1x2` → always `false` (no animation in tight/popover contexts)
- `2x1`, `2x2`, `table`, `page` → respect `animate` prop and `useReducedMotion`

### 12. Update Drift Check Rule W27

In web-drift-check.mjs — add validation:
- Warn if `size=` is still used (deprecation lint)
- Warn if `className="border-0"` appears alongside `constraint=` (redundant override)

### 13. Update Tests

In empty-state.test.tsx or create if not existing:
- Add `describe.each` over all 6 constraint tiers
- For each tier, assert:
  - Title always renders
  - Description renders only when `CONSTRAINT_SLOTS[tier].description === true`
  - Action renders only when `CONSTRAINT_SLOTS[tier].action === true`
  - Border class is correct per tier
  - axe passes for all tiers
- Add deprecation test: passing `size="sm"` triggers `console.warn` and maps to `1x1`

---

**Verification**

- `pnpm typecheck` — all consumers updated, no type errors from `size` → `constraint`
- `pnpm test --filter @afenda/web -- empty-state` — all constraint tier tests pass
- `pnpm lint` — W27 drift check passes with no `size=` or redundant `className` overrides
- Manual: visit dashboard, open popovers, view report pages — empty states render correctly per tier
- Manual: resize browser — `1x1` stays compact in bento, `2x2` fills chart area, `page` takes full width

---

**Decisions**

- **`constraint` replaces `size`** — deprecation period with dev warnings, not a silent rename
- **6 tiers** chosen over 4 because popovers (`1x2`) and dashboard blocks (`2x1`) have genuinely different dimension profiles (vertical-scroll w-80 vs horizontal-span col-span-2)
- **KPI inline rendering removed** — replaced by `<EmptyState constraint="1x1">` consuming the same registry content, eliminating the dual rendering path
- **Border driven by tier** — `1x1`/`1x2` = `border-0` (embedded in already-bordered containers like Card/Popover), others = `border border-dashed`. Eliminates all manual `className="border-0"` overrides. For edge cases, `className` override still works as an escape hatch
- **Content slots enforce visibility** — passing `description` to a `1x1` tier silently hides it rather than erroring, making consumers future-proof if they're later promoted to `2x2`
# KPI Card Audit Report

**Date:** 2025-03-01  
**Scope:** New KPI card optimizations (compact mode, unified helper, size-aware layout)

## Executive Summary

Audit of the KPI card implementation identified **one critical bug** and **two hardening improvements**. All have been addressed.

---

## Findings & Fixes

### 1. Critical: Lost KPI ID on Resolver Failure

**Location:** `apps/web/src/lib/kpis/kpi-registry.server.ts` → `resolveKPIs()`

**Issue:** When a KPI resolver promise was rejected (e.g. network error, thrown exception), the error stub used `id: '?'` instead of preserving the original KPI id. This caused:

- `catalogById.get('?')` → `undefined` (catalog has no `'?'` entry)
- `dataById.get(item.i)` → mismatch when layout used real ids
- Cards failing to render (`!catalogEntry || !data` → `return null`)

**Fix:** Preserve the original id using the index:

```ts
return results.map((r, i): KPIResolverResult => {
  if (r.status !== 'fulfilled' || !r.value) {
    return { id: ids[i] ?? '?', value: '—', formattedValue: '—', status: 'error' };
  }
  // ...
});
```

---

### 2. Hardening: Layout Normalization on Save

**Location:** `apps/web/src/lib/dashboards/bento-kpi-deck.client.tsx` → `handleLayoutChange`

**Issue:** `react-grid-layout` may add extra properties (`moved`, `static`, etc.) and can produce fractional `w`/`h` values. Saving raw layout could cause schema drift or invalid values.

**Fix:** Normalize layout before persisting to only `{ i, x, y, w, h }` with integer dimensions:

```ts
const normalized = newLayout.map((item) => ({
  i: item.i,
  x: item.x,
  y: item.y,
  w: Math.round(item.w) || 1,
  h: Math.round(item.h) || 1,
}));
```

---

### 3. Hardening: Defensive gridW/gridH

**Location:** `apps/web/src/lib/dashboards/bento-kpi-deck.client.tsx` → KPICard props

**Issue:** If layout items ever had `w` or `h` of 0 or undefined, `isCompact(0, 1)` would incorrectly treat the card as non-compact (0 !== 1), and `gridH` 0 could cause layout oddities.

**Fix:** Coerce to at least 1:

```ts
gridW={Math.max(1, item.w ?? 1)}
gridH={Math.max(1, item.h ?? 1)}
```

---

## Verification Checklist

| Area | Status |
|------|--------|
| BentoKpiDeck passes gridW/gridH to KPICard | ✅ |
| Compact mode (1×1) shows value + trend only | ✅ |
| Hero card (2×1) shows full layout | ✅ |
| TemplateRenderer receives compact prop | ✅ |
| All templates support compact variant | ✅ |
| resolveKPIs preserves id on error | ✅ |
| Layout save normalizes to schema | ✅ |
| kpi-deck.client.tsx / dashboard-page.tsx | No gridW/gridH (intentional: simple grid, defaults to compact) |

---

## Usage Summary

| Consumer | gridW / gridH | Behavior |
|----------|---------------|----------|
| BentoKpiDeck | From layout item | Size-aware; 1×1 compact, 2×1/1×2/2×2 full |
| kpi-deck.client.tsx | Not passed | Defaults to compact (1×1) |
| dashboard-page.tsx | Not passed | Defaults to compact (1×1) |

---

## Recommendations & Implemented Optimizations

### Implemented (2025-03-01)

1. **useTransition for layout save** — `onSavePrefs` wrapped in `startTransition` so drag/resize stays responsive; save runs as non-urgent update (React 19 best practice).
2. **Optimistic layout update** — Local layout state; update immediately on drag/resize and persist in background; sync from server when widget set or preset changes via `useEffect`.
3. **Error state UX** — Cards with `status: 'error'` show a "Refresh" action in the helper dropdown, clearer visual treatment (`ring-1 ring-destructive/20`), and optional `onRefresh` prop (BentoKpiDeck passes `router.refresh()`).

### Bento / Visual Quality (2025-03-01)

6. **Card density** — Override base Card `py-6`/`gap-6` with `!p-0 !gap-0`; use `!px-4 !pt-3` on header/content/footer for dense bento layout.
7. **Value typography** — `font-semibold tabular-nums tracking-tight` for all KPI values (consistent alignment, cleaner weight).
8. **Grid container** — `w-full min-w-0` on CollapsibleContent and wrapper so WidthProvider gets correct width (fixes flex/shrink issues).
9. **Placeholder styling** — Override react-grid-layout’s red placeholder with `[&_.react-grid-placeholder]:!bg-primary/10 [&_.react-grid-placeholder]:!rounded-lg`.

### Implementation Notes

- **Hero card**: First card is 2×1 when no saved layout (`computeLayout`); saved layouts are preserved.
- **WidthProvider**: Requires a parent with explicit width; `min-w-0` prevents flex children from overflowing.
- **Card padding**: Base `Card` uses `py-6`; KPI cards use `!` overrides for a denser grid.

### Configure Dialog (2025-03-01)

12. **Sheet instead of Popover** — Migrated to shadcn Sheet for more space and clearer modal UX (competitor-aligned).
13. **Apply + router.refresh()** — Apply now calls `router.refresh()` after save so charts/diagrams update immediately.
14. **Reset & Reset & Apply** — Reset clears form; "Reset & Apply" restores defaults and saves in one action.
15. **Chart/diagram "None"** — Added "None" option; `CHART_DIAGRAM_NONE` sentinel hides chart/diagram when selected.
16. **Layout** — ScrollArea, Separator, Label; improved hierarchy and shadcn consistency.

### Future

17. **E2E coverage** — Add a smoke test for the finance dashboard KPI deck to catch regressions.
18. **Debounced save** — Consider debouncing layout saves when the user is actively resizing to reduce API calls.

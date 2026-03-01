# Dashboard Bento / KPI Deck — Audit & Evaluation

**Date:** 2026-03-01  
**Scope:** KPI card, hero isolation area, chart and diagram setup in the finance domain dashboard.

---

## Executive Summary

The current bento KPI deck combines KPIs, charts, and diagrams in a single react-grid-layout with mixed constraints, hero promotion logic, and compact-mode chart rendering. Several design decisions create complexity and inconsistent behavior.

---

## 1. Architecture Overview

### Current Structure

```
DomainDashboardShell (server)
  └─ DomainDashboardLayout
       ├─ Header (title, description)
       ├─ DashboardHeaderBar (time range, plain language, config dialog)
       ├─ KpiDeckLoader (async) → BentoKpiDeck (client)
       │    └─ ResponsiveGridLayout (react-grid-layout)
       │         ├─ Hero slot (2×2) — KPI promoted when dropped at (0,0)
       │         ├─ KPI cards (1×1 or 2×2)
       │         ├─ Chart slot (3×3) — Cash Flow / Revenue & Expenses
       │         └─ Diagram slot (3×3) — AR Aging / AP Aging
       └─ FeatureGrid (nav shortcuts)
```

### Key Files

| File | Responsibility |
|------|----------------|
| `bento-kpi-deck.client.tsx` | Grid layout, hero detection, widget rendering |
| `domain-dashboard-shell.tsx` | Server orchestration, KPI resolution, chart data fetch |
| `kpi-card.tsx` | Individual KPI display (compact vs full) |
| `dashboard-charts.tsx` | CashFlowChart, RevenueExpenseChart, ARAgingChart, APAgingChart |
| `widget-config-dialog.client.tsx` | Add/remove widgets, chart/diagram selection |

---

## 2. Issues Identified

### 2.1 Hero Isolation Area — "Haywire" Behavior

**Problems:**
- **Implicit promotion:** Dropping any KPI at (0,0) auto-expands to 2×2 and marks as "hero". No explicit user intent.
- **Empty state UX:** When no hero, a large dashed "Drop KPI here" zone occupies 50% width (or 100% on mobile). Visually noisy.
- **Layout thrash:** Moving hero out of (0,0) triggers layout recompute; prev hero shrinks to 1×1, new hero expands.
- **"Hero" badge:** Absolute-positioned gradient badge feels tacked-on; doesn't align with shadcn card patterns.

**Recommendations:**
- Make hero **opt-in**: User explicitly marks a KPI as hero via context menu or config dialog.
- Replace empty drop zone with a subtle placeholder card ("Drag a KPI here to feature it") or remove entirely.
- Use shadcn Card elevation/variant for hero instead of custom ring + gradient badge.

### 2.2 KPI Card — Mixed Concerns

**Problems:**
- **Compact vs full:** `gridW`/`gridH` drive layout; 1×1 = compact (minimal footer), 2×2 = full (footer with actions). Logic scattered.
- **Template system:** `TemplateRenderer` switches on `catalog.template`; many branches, hard to extend.
- **Hero styling:** Hero gets `ring-2 ring-primary/30 shadow-lg` — different from normal cards; inconsistent.
- **Motion:** Framer Motion `whileHover`/`whileTap` on hero only; other cards static. Inconsistent interaction model.

**Recommendations:**
- Unify card variants via `variant` prop: `compact` | `default` | `hero`.
- Use `cva` (class-variance-authority) for card variants — shadcn pattern.
- Remove motion from hero or apply consistently to all cards (with `prefersReducedMotion`).

### 2.3 Chart & Diagram — Constraint Mismatch

**Problems:**
- **Fixed 3×3:** Charts and diagrams are locked to 3×3 grid units. On 4-col layout that's 75% width; on 2-col it's 150% (overflow).
- **Compact mode:** Charts receive `compact` prop; switch layout (smaller header, flex fill). Inconsistent with KPI card sizing.
- **Single chart/diagram:** Only one chart and one diagram shown; selection via config dialog. No in-grid switching.
- **Recharts in grid:** ResponsiveContainer + Recharts inside RGL can cause resize loops; `debounce={50}` helps but not ideal.

**Recommendations:**
- **Responsive chart size:** On cols &lt; 4, charts should span full width (cols) and reduce height.
- **Consider CSS Grid:** Replace react-grid-layout with CSS Grid + `grid-template-areas` for predictable, overflow-free layout.
- **Chart container:** Use shadcn ChartContainer pattern (ChartConfig, ChartTooltipContent) for consistency.

### 2.4 Layout Engine — react-grid-layout

**Problems:**
- **Pixel-based:** RGL uses pixel positions; responsive breakpoints (4/2/1 cols) can cause overflow when items have minW &gt; 1.
- **isBounded:** Helps but doesn't prevent all overflow on narrow viewports.
- **Persisted layout:** Saved `widgetLayout` can have coordinates that don't fit new viewport; no validation on load.
- **Drag handle:** `.react-grid-drag-handle` on every item; adds DOM, can conflict with card interactions.

**Recommendations:**
- **Validation:** On load, clamp persisted layout to current cols; reflow if items would overflow.
- **Fallback layout:** If persisted layout invalid, fall back to `computeLayout` with defaults.
- **Alternative:** Evaluate CSS Grid + `grid-area` for static layouts; keep drag-drop for reorder only (simpler).

---

## 3. shadcn Alignment Gaps

| Area | Current | shadcn Pattern |
|------|---------|----------------|
| Card | Custom ring/shadow for hero | Use Card `variant` or `className` override |
| Chart | Recharts + custom tooltip | ChartContainer, ChartConfig, ChartTooltipContent |
| Layout | react-grid-layout | Consider CSS Grid or simple flex |
| Badge | Gradient "Hero" pill | Badge with `variant="secondary"` or similar |
| Collapsible | Used for deck toggle | Good — matches shadcn Collapsible |

---

## 4. Recommended Next Steps

1. **Short-term (stability):**
   - ✅ App-shell: flex vertical, overflow-x-hidden (done)
   - ✅ Bento wrapper: overflow-hidden, min-w-0 (done)
   - Add layout validation on prefs load

2. **Medium-term (UX):**
   - Make hero opt-in; simplify or remove empty drop zone
   - Unify KPI card variants with cva
   - Responsive chart sizing (cols-aware)

3. **Long-term (architecture):**
   - Evaluate CSS Grid for dashboard layout
   - Migrate charts to shadcn Chart component
   - Extract hero logic to a dedicated "featured KPI" concept

---

## 5. Configuration Reference

### TYPE_CONSTRAINTS (bento-kpi-deck.client.tsx)

```ts
hero:   { minW: 2, minH: 2, maxW: 2, maxH: 2 }  // fixed 2×2
kpi:    { minW: 1, minH: 1, maxW: 2, maxH: 2 }  // 1×1 or 2×2
chart:  { minW: 3, minH: 3, maxW: 3, maxH: 3 }  // fixed 3×3
diagram:{ minW: 3, minH: 3, maxW: 3, maxH: 3 }  // fixed 3×3
```

### Responsive Breakpoints

- **lg (≥1024px):** 4 cols
- **md (≥640px):** 2 cols
- **sm (&lt;640px):** 1 col

Charts/diagrams at 3×3 overflow when cols &lt; 3.

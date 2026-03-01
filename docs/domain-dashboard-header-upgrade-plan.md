# Domain Dashboard Header — Upgrade Plan

> **Goal:** Turn the domain header bar from a broken, non-functional control strip into a real, user-beneficial toolbar that drives dashboard value.

---

## Current State (What’s Broken)

### 1. **Time Range (MTD/QTD/YTD) — Dead Control**

- **Behavior:** Saved to `prefs.timeRange` via `onSavePrefs`.
- **Problem:** Never passed to `resolveKPIs()` or any data layer. KPI resolvers return stub data and ignore time range.
- **Impact:** Users change MTD/QTD/YTD and nothing changes. Control is misleading.

### 2. **Compare Dropdown — Functional but Poor UX**

- **Behavior:** `comparisonMode` is passed to `resolveKPIs`; KPI cards show vs prior/budget/plan.
- **Problems:**
  - Label truncation (e.g. "No comparisc" instead of "No comparison").
  - Narrow trigger (`w-[140px]`) causes clipping.
  - No visual feedback when comparison is active.

### 3. **View Selector — Works but Weak Discoverability**

- **Behavior:** `savedViewId` selects preset → changes `selectedWidgetIds`, `chartId`, `diagramId`.
- **Problems:**
  - Presets (Overview, Cash focus, Executive) are not explained.
  - "Custom" appears when user has customized; no clear way to "save as new preset" or reset.

### 4. **Plain Language Toggle — Works**

- **Behavior:** `plainLanguage` passed to KPI cards; switches labels (e.g. "Money owed" vs "Total Payables").
- **Minor:** No tooltip or helper text; benefit is not obvious.

### 5. **Layout & Framework Mismatch**

- **Problem:** Header bar does not follow the same patterns as ModuleNavPopover / ShortcutPopover.
- **Gaps:**
  - No consistent shell tokens (width, spacing).
  - Mobile: single "Filters" button opens a bare popover; no structure.
  - No clear visual hierarchy or grouping.

### 6. **Save Flow — Full Page Revalidate**

- **Behavior:** `saveDashboardPrefs` → API patch → `revalidatePath('/finance')`.
- **Problem:** Every control change triggers a full server round-trip and page refresh. Feels slow; no optimistic UI.

---

## Upgrade Plan (Phased)

### Phase 1: Fix Broken / Misleading Controls (Quick Wins)

| Task | Action |
|------|--------|
| **1.1 Time range** | Either (a) wire `timeRange` into `resolveKPIs` and KPI resolvers, or (b) remove/hide the control until backend supports it. Prefer (a) if API can filter by date range. |
| **1.2 Compare dropdown** | Increase trigger width (`min-w-[10rem]` or `w-auto min-w-44`), fix truncation. Add `title` or full label in SelectValue. |
| **1.3 View selector** | Add short descriptions for presets (e.g. in SelectItem or tooltip). Ensure "Custom" is clearly labeled. |

**Deliverable:** All visible controls either work or are clearly disabled/coming-soon.

---

### Phase 2: Align with App-Shell Framework

| Task | Action |
|------|--------|
| **2.1 Shell tokens** | Use `ACTION_BTN`, `ACTION_GAP`, `POPOVER_*` from `shell.tokens` for consistency with ModuleNavPopover, ShortcutPopover. |
| **2.2 Mobile popover** | Restructure Filters popover: PopoverHeader + PopoverTitle, grouped sections (View, Time, Compare, Plain language), same layout as desktop but stacked. |
| **2.3 Responsive layout** | Desktop: horizontal bar with clear gaps. Mobile: icon-only trigger, full popover with sections. |

**Deliverable:** Header bar feels like part of the same design system as the app shell.

---

### Phase 3: User Benefit & Clarity

| Task | Action |
|------|--------|
| **3.1 Saved view descriptions** | Add `description?: string` to `SavedViewPreset`; show in dropdown or tooltip (e.g. "Overview — All key metrics" / "Cash focus — Liquidity and cash flow"). |
| **3.2 Plain language helper** | Add Tooltip: "Use simpler labels (e.g. 'Money owed' instead of 'Total Payables')". |
| **3.3 Comparison feedback** | When `comparisonMode !== 'none'`, add a subtle badge or indicator in the header (e.g. "Comparing: vs prior period"). |
| **3.4 Time range feedback** | When wired: show active range in UI (e.g. "MTD: Mar 1–31, 2025"). |

**Deliverable:** Users understand what each control does and see clear feedback when options are active.

---

### Phase 4: Performance & Polish

| Task | Action |
|------|--------|
| **4.1 Optimistic UI (optional)** | Use `useOptimistic` or local state to update UI immediately on change; sync with server in background. Requires careful handling of prefs. |
| **4.2 Loading state** | When `revalidatePath` runs, show a subtle loading indicator (e.g. skeleton on KPI deck) instead of full-page flash. |
| **4.3 Error handling** | If `saveDashboardPrefs` fails, show toast and revert control state. |

**Deliverable:** Controls feel responsive; errors are handled gracefully.

---

## Technical Notes

### Wiring `timeRange` to KPI Resolvers

1. **Contracts:** `DashboardPrefs.timeRange` already exists (`mtd` | `qtd` | `ytd` | `custom`).
2. **Domain shell:** Pass `timeRange` from prefs into `resolveKPIs(activeKpiIds, ctx, { comparisonMode, timeRange })`.
3. **KPI registry:** Extend `RequestContextLike` with `timeRange?: TimeRange`.
4. **Resolvers:** Each resolver computes date bounds from `timeRange` (e.g. MTD = first of month to today) and uses them in queries. Stub resolvers can return different placeholder values per range for demo.

### File Touch Points

| File | Changes |
|------|---------|
| `dashboard-header-bar.client.tsx` | Fix truncation, tokens, mobile popover structure |
| `domain-dashboard-shell.tsx` | Pass `timeRange` to `resolveKPIs` |
| `kpi-registry.server.ts` | Accept `timeRange` in context; use in resolvers |

---

## Success Criteria

1. **No dead controls** — Every visible control affects the dashboard or is clearly disabled.
2. **Consistent framework** — Header bar matches ModuleNavPopover / ShortcutPopover patterns.
3. **Clear benefit** — Users can quickly switch views, time ranges, and comparison modes with obvious feedback.
4. **Professional UX** — No truncation, proper labels, accessible (aria, fieldset/legend).

---

## Out of Scope (Future)

- Custom date range picker (for `timeRange: 'custom'`).
- "Save as new preset" from user’s custom layout.
- Real-time updates without full revalidate (e.g. streaming or client-side data fetch).

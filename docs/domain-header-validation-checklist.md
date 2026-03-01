# Domain Header — End-to-End Validation Checklist

> Use this checklist to validate the domain header UI design and configuration options on the Finance Dashboard (`/finance`).

---

## Prerequisites

1. **Dev server running:** `pnpm dev` or `pnpm dev:web`
2. **Authenticated session:** Log in as a user with finance access
3. **Navigate to:** `/finance`

---

## 1. Domain Header Bar — Visibility & Structure

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 1.1 | Header bar is visible below page title | Horizontal bar with View, Time range, Compare, Plain language | ☐ |
| 1.2 | No horizontal overflow | All controls fit within viewport; no horizontal scrollbar | ☐ |
| 1.3 | Responsive: desktop (≥768px) | All controls in a single row with gaps | ☐ |
| 1.4 | Responsive: mobile (<768px) | "Filters" button visible; controls hidden; tap opens popover | ☐ |

---

## 2. View Selector

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 2.1 | View dropdown visible | Label "View" + Select showing current preset (Overview, Cash focus, Executive) | ☐ |
| 2.2 | Select options | Overview, Cash focus, Executive, Custom (your layout) | ☐ |
| 2.3 | Change to "Cash focus" | KPIs/charts update; page revalidates; no error toast | ☐ |
| 2.4 | Change to "Executive" | Different KPI set; chart changes to Revenue/Expense | ☐ |
| 2.5 | Hover preset in dropdown | Tooltip shows description (e.g. "Liquidity and cash flow metrics") | ☐ |

---

## 3. Time Range (MTD/QTD/YTD)

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 3.1 | Tabs visible | MTD, QTD, YTD as segmented control | ☐ |
| 3.2 | MTD selected by default | MTD tab has active styling | ☐ |
| 3.3 | Click QTD | KPI values change (e.g. Cash $3.85M vs $1.25M MTD); loading spinner briefly | ☐ |
| 3.4 | Click YTD | KPI values change again (e.g. Cash $15.2M) | ☐ |
| 3.5 | Hover time range tabs | Tooltip shows date range (e.g. "Mar 1 – 31, 2025") | ☐ |

---

## 4. Compare Selector

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 4.1 | Compare dropdown visible | Label "Compare" + Select | ☐ |
| 4.2 | Default: "No comparison" | No comparison badge; KPI cards show no vs prior/budget/plan | ☐ |
| 4.3 | Select "vs prior period" | Badge appears; KPI cards show comparison (e.g. "+3.2% vs prior") | ☐ |
| 4.4 | No truncation | Full label "No comparison" visible (not "No comparisc") | ☐ |

---

## 5. Plain Language Toggle

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 5.1 | Toggle visible | Switch + "Plain language" label | ☐ |
| 5.2 | Hover toggle | Tooltip: "Use simpler labels (e.g. 'Money owed' instead of 'Total Payables')" | ☐ |
| 5.3 | Toggle ON | KPI labels change (e.g. "Money owed" vs "Total Payables") | ☐ |
| 5.4 | Toggle OFF | Labels revert to technical terms | ☐ |

---

## 6. Save Flow & Loading State

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 6.1 | Change any control | Loader2 spinner appears; controls disabled during save | ☐ |
| 6.2 | Save succeeds | Spinner disappears; page revalidates; new data visible | ☐ |
| 6.3 | Save fails (simulate: disconnect network) | Toast error; controls re-enabled; previous state preserved | ☐ |

---

## 7. Mobile Popover (Filters)

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 7.1 | Resize to <768px | "Filters" button appears | ☐ |
| 7.2 | Click Filters | Popover opens with "Dashboard filters" title | ☐ |
| 7.3 | Popover content | View, Time range, Compare, Plain language in stacked layout | ☐ |
| 7.4 | Change option in popover | Saves; popover can be closed | ☐ |

---

## 8. Accessibility

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 8.1 | Tab through controls | Focus order: View → MTD/QTD/YTD → Compare → Plain language | ☐ |
| 8.2 | Keyboard: Select View | Space/Enter opens dropdown; Arrow keys navigate options | ☐ |
| 8.3 | Keyboard: Time range | Tab to MTD/QTD/YTD; Enter selects | ☐ |
| 8.4 | Screen reader | `aria-label` / `aria-labelledby` on all controls; `role="toolbar"` on header bar | ☐ |

---

## 9. E2E Tests (Automated)

Run with dev server at `http://localhost:3000`:

```bash
cd apps/e2e
pnpm test:e2e tests/finance/dashboard-bento.spec.ts
```

| Test | Description |
|------|-------------|
| Key Metrics section is visible | Section header present |
| Bento deck container renders | `data-testid="bento-kpi-deck"` |
| Bento grid layout is present | `data-testid="bento-grid-layout"` |
| Main content is not blank | Content area has text |
| Domain header bar is visible | `data-testid="dashboard-header-bar"` |
| Time range tabs present | MTD, QTD, YTD tabs |
| Compare selector present | Compare dropdown |
| Plain language toggle present | Switch for plain language |

---

## Known Data Flow

- **View** → `savedViewId` + `selectedWidgetIds` + `selectedChartId` + `selectedDiagramId` from preset
- **Time range** → `timeRange` → passed to `resolveKPIs()` → KPI values vary by MTD/QTD/YTD
- **Compare** → `comparisonMode` → passed to `resolveKPIs()` → KPI cards show vs prior/budget/plan
- **Plain language** → `plainLanguage` → passed to `KPICard` → label uses `plainTitle` when true

---

## Quick Manual Test Script

1. Open `/finance`
2. Change View to "Cash focus" → verify KPIs change
3. Change Time range to QTD → verify values (e.g. Cash ~$3.85M)
4. Change Compare to "vs prior period" → verify comparison badge and card content
5. Toggle Plain language ON → verify label change (e.g. "Money owed")
6. Refresh page → verify all selections persist
7. Resize to mobile → verify Filters popover works

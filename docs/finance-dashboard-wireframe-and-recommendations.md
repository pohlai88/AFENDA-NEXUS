# Finance Dashboard — Northstar Plan & Implementation Reference

> **Goal:** Build the finance dashboard that beats NetSuite, SAP Fiori, QuickBooks, Dynamics 365, Zoho, and Stripe by combining their best ideas with our differentiator: **bento grid + ERPNext-style layout**.

---

## Table of Contents

1. [Northstar Vision](#northstar-vision)
2. [Source Files & Directory Reference](#source-files--directory-reference)
3. [Competitor & Zoho Learnings](#competitor--zoho-learnings)
4. [KPI Catalog Northstar Schema](#kpi-catalog-northstar-schema)
5. [Layout Structure & Wireframe](#layout-structure--wireframe)
6. [Phased Roadmap](#phased-roadmap)
7. [Implementation Checklist](#implementation-checklist)
8. [Validation Log](#validation-log-last-verified) — Phase 1–4 vs codebase

---

## Northstar Vision

| We Beat Competitors By | How |
|------------------------|-----|
| **Personalization** | Bento grid + drag-drop + resize (Dynamics) + persisted layout — shipped |
| **Actionability** | ERPNext-style layout: Features & Functions at bottom when scrolled — act immediately |
| **Clarity** | Semantic grouping (Fiori) + plain language (Xero) + hero metrics (Stripe) |
| **Flexibility** | Time-range selector (NetSuite) + role-based views (NetSuite) + saved views (D365) |
| **Trust** | Status badges (D365) + drill-down (NetSuite) + targets & thresholds (Zoho) |
| **Performance** | Skeleton loading (Stripe) + empty states (Stripe) + sparklines inline |
| **Discoverability** | Tooltips (Zoho) + search keywords + Zia-style NL discovery |

---

## Source Files & Directory Reference

### Core Dashboard Infrastructure

| Purpose | Path | Notes |
|---------|------|-------|
| **Domain dashboard shell** | `apps/web/src/lib/dashboards/domain-dashboard-shell.tsx` | Server component: loads prefs, resolves KPIs, composes layout |
| **Domain dashboard layout** | `apps/web/src/lib/dashboards/domain-dashboard-layout.tsx` | Layout wrapper: header, KPI deck, visuals, feature grid |
| **Domain config types** | `apps/web/src/lib/dashboards/types.ts` | `DomainDashboardConfig` interface |
| **Domain configs** | `apps/web/src/lib/dashboards/domain-configs.ts` | Per-domain configs (AP, AR, GL, Banking, etc.) |
| **Dashboard index** | `apps/web/src/lib/dashboards/index.ts` | Public exports |

### KPI System

| Purpose | Path | Notes |
|---------|------|-------|
| **KPI catalog** | `apps/web/src/lib/kpis/kpi-catalog.ts` | Catalog: title, template, quickActions, description, module, category, tags, emptyState |
| **KPI registry (resolvers)** | `apps/web/src/lib/kpis/kpi-registry.server.ts` | Server-only: resolves KPI values, indicator, sparklineData, isEmpty |
| **KPI alert service** | `apps/web/src/lib/kpis/kpi-alert.service.ts` | Threshold-based alert checks (stub: logs in dev) |
| **KPI catalog validation** | `apps/web/src/lib/kpis/kpi-catalog.validate.ts` | Catalog ↔ registry alignment validation |
| **KPI card component** | `apps/web/src/components/erp/kpi-card.tsx` | Renders card: badge, value, trend, sparkline, quick action |
| **Chart resolvers** | `apps/web/src/lib/kpis/chart-resolvers.server.ts` | Chart data resolution |

### Client Components

| Purpose | Path | Notes |
|---------|------|-------|
| **Bento KPI deck** | `apps/web/src/lib/dashboards/bento-kpi-deck.client.tsx` | Drag-drop grid, hero metric, KPICard rendering |
| **Legacy KPI deck** | `apps/web/src/lib/dashboards/kpi-deck.client.tsx` | Simpler grid (if used) |
| **Widget config dialog** | `apps/web/src/lib/dashboards/widget-config-dialog.client.tsx` | Configure: select KPIs, chart, diagram |
| **Dashboard header bar** | `apps/web/src/lib/dashboards/dashboard-header-bar.client.tsx` | Time range tabs, plain language toggle, saved view selector |
| **Feature grid** | `apps/web/src/lib/dashboards/feature-grid.tsx` | Bottom nav shortcuts (Overview, GL, AP, AR, Banking) |
| **Dashboard visuals** | `apps/web/src/lib/dashboards/dashboard-visuals-section.tsx` | Chart + diagram slots |
| **Chart registry** | `apps/web/src/lib/dashboards/chart-registry.ts` | Chart metadata (chart.cashflow, chart.revenueExpense) |

### Finance-Specific Blocks

| Purpose | Path | Notes |
|---------|------|-------|
| **Dashboard sections** | `apps/web/src/features/finance/dashboard/blocks/dashboard-sections.tsx` | Skeleton, section wrappers |
| **Dashboard charts** | `apps/web/src/features/finance/dashboard/blocks/dashboard-charts.tsx` | Chart rendering |
| **Attention panel** | `apps/web/src/features/finance/dashboard/blocks/attention-panel.tsx` | Overdue, blocked items — used on finance page |
| **Activity feed** | `apps/web/src/features/finance/dashboard/blocks/activity-feed.tsx` | Activity feed — used on finance page |
| **Quick actions** | `apps/web/src/features/finance/dashboard/blocks/quick-actions.tsx` | Quick action shortcuts |

### Routes & Pages

| Purpose | Path | Notes |
|---------|------|-------|
| **Finance overview page** | `apps/web/src/app/(shell)/(erp)/finance/page.tsx` | Finance dashboard route |
| **Dashboard page (generic)** | `apps/web/src/app/dashboard/page.tsx` | Generic dashboard route |
| **ERP dashboard page** | `apps/web/src/components/erp/dashboard-page.tsx` | Dashboard page component |

### Contracts & Preferences

| Purpose | Path | Notes |
|---------|------|-------|
| **User preferences** | `packages/contracts/src/kernel/user-preferences.ts` | `DashboardPrefs`, `TimeRangeSchema`, `WidgetLayoutItemSchema` |
| **Route constants** | `apps/web/src/lib/constants.ts` | `routes.finance.*` (payables, receivables, banking, etc.) |

### Actions & API

| Purpose | Path | Notes |
|---------|------|-------|
| **Save dashboard prefs** | `apps/web/src/lib/dashboards/actions.ts` | Server action to persist prefs |

---

## Competitor & Zoho Learnings

### NetSuite
- Time-range selector (MTD/QTD/YTD/custom)
- Drill-down from card to detail
- Comparison mode (vs plan, vs prior period)
- Role-based default views

### SAP Fiori
- Semantic grouping (Cash, Receivables, Payables, Operations)
- Actionable tiles (approve from tile)
- Responsive grid (4→2→1 columns)

### QuickBooks / Xero
- Plain language labels ("Money owed" vs "Total Payables")
- Hero metrics (1–2 prominent cards)
- Simple, approachable UX

### Dynamics 365
- Status badges ("On track" / "At risk" / "Overdue")
- Saved views (named presets)
- Personalization (drag-drop, persisted layout)

### Stripe
- Sparklines inline
- Empty states with guided onboarding
- Skeleton loading for perceived performance

### Zoho Analytics (Adopted)

| Zoho Feature | Our Adoption |
|--------------|--------------|
| **KPI widget taxonomy** | Label (single, +secondary, +indicator), Bullet, Dial (simple/speedometer/conditional), Full dial |
| **Targets & qualitative ranges** | `targetValue`, `minValue`, `maxValue`, `thresholds[]` in catalog |
| **Descriptive tooltips** | `description` (≤250 chars) on every widget |
| **Drill-through** | `drillTargets[]` — multiple linked reports per widget (up to 20) |
| **KPI + forecasting** | `forecastEligible`, `goalValue` for future |
| **Contextual alerts** | `alertConfig` for threshold-based notifications |
| **Fine-grained access** | `defaultForRoles[]`, `requiredPermissions[]` |
| **Dynamic labels** | `labelFormat` with placeholders (e.g. `${PERCENTAGE}`) |
| **150+ prebuilt structure** | `module`, `category` (business_overview, cashflow, compliance) |
| **Zia AI discoverability** | `searchKeywords[]`, `plainTitle` |

---

## KPI Catalog Northstar Schema

Target schema for `apps/web/src/lib/kpis/kpi-catalog.ts`:

```ts
// Widget types (current + Zoho-inspired)
type KPITemplate =
  | 'value-trend'      // Label + indicator (current)
  | 'value-sparkline'  // Label + sparkline
  | 'bullet'           // Bullet chart vs target (Zoho)
  | 'dial'             // Simple dial (Zoho)
  | 'speedometer'      // Red/yellow/green ranges (Zoho)
  | 'dial-conditional' // Color by threshold (Zoho)
  | 'aging'            // Bucket bar
  | 'count-status'
  | 'ratio'
  | 'stub';

// Threshold for conditional display (Zoho)
interface KPIThreshold {
  value: number;
  color: 'success' | 'warning' | 'destructive';
  label?: string;
}

export interface KPICatalogEntry {
  id: string;
  title: string;
  plainTitle?: string;
  description?: string;        // Tooltip ≤250 chars (Zoho)
  helpText?: string;           // Longer help / empty state

  template: KPITemplate;
  format: 'money' | 'count' | 'percent' | 'text';

  href?: string;
  drillTargets?: { label: string; href: string }[];  // Zoho: multiple drill targets

  group?: KPIGroup;
  module: string;              // 'ap' | 'ar' | 'gl' | 'banking' | ...
  category?: string;           // 'business_overview' | 'cashflow' | 'compliance'

  quickActions?: KpiQuickAction[];  // Multiple actions (Zoho actionable tiles)

  // Targets & ranges (Zoho bullet/dial)
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  thresholds?: KPIThreshold[];

  // Display
  displayPriority?: number;
  heroEligible?: boolean;
  icon?: string;
  tags?: string[];

  // Role & access (Zoho)
  defaultForRoles?: string[];
  requiredPermissions?: string[];

  // Time & comparison
  periodContext?: 'mtd' | 'qtd' | 'ytd' | 'rolling';
  comparisonModes?: ('vs_prior_period' | 'vs_budget' | 'vs_plan')[];

  // Future
  forecastEligible?: boolean;
  goalValue?: number;
  alertConfig?: { threshold: number; operator: string; notifyChannels?: string[] };
  searchKeywords?: string[];
  emptyState?: { title: string; description: string; ctaLabel: string; ctaHref: string };
}
```

### Catalog API (Implemented)

```ts
// apps/web/src/lib/kpis/kpi-catalog.ts

getKPICatalogEntries(kpiIds: string[]): KPICatalogEntry[]
getCatalogEntry(id: string): KPICatalogEntry | undefined
getAllCatalogEntries(domainId?: string): KPICatalogEntry[]
getCatalogByGroup(group: KPIGroup): KPICatalogEntry[]
getCatalogByTag(tag: KPITag): KPICatalogEntry[]
getHeroEligibleEntries(): KPICatalogEntry[]
getQuickActions(entry: KPICatalogEntry): KpiQuickAction[]
```

---

## Layout Structure & Wireframe

### Current Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Finance Dashboard                                                                        │
│  Real-time financial overview, KPIs, and key performance indicators for your organization │
│  [View: Overview ▼]  [MTD] [QTD] [YTD]    [Plain language: On ▼]                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [▼] Key Metrics                                                    [Configure]          │
├───────────────────────────────────────────────────────────────────────── CASH & LIQUIDITY │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │ Cash in bank                              Bank Balance              [Reconcile]      ││
│  │ $1,250,000  ↑ 3.2%  │ On track           ▁▂▃▄▅▆▇█                                  ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────┐ ┌─────────────────────┐                                        │
│  │ Cash Forecast (30d)  │ │ Money to receive   │ [New Invoice]                          │
│  │ $2,100,000  ↑ 5.6%   │ │ $520,000  ↑ 2.8%   │                                        │
│  └─────────────────────┘ └─────────────────────┘                                        │
├───────────────────────────────────────────────────────────────────────── PAYABLES        │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │ Money owed                    Total Payables                      [Record Bill]      ││
│  │ $340,000  ↓ 5.1%  │ At risk                                                          ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
├───────────────────────────────────────────────────────────────────────── OPERATIONS     │
│  Journals (MTD) 156  │  Budget Variance 4.2%  │  Pending Returns 2                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Charts & Diagrams                                                                        │
│  ┌────────────────────────────────────────────┐ ┌─────────────────────────┐              │
│  │  Cash Flow / Revenue & Expenses              │ │  AR Aging               │              │
│  └────────────────────────────────────────────┘ └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────────────────────────────────
                         SEPARATOR (ERPNext-style: actionable below)
─────────────────────────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Features & Functions                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Overview │ │ GL       │ │ AP       │ │ AR       │ │ Banking  │ ...                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Attention Items (overdue, blocked)  │  Activity Feed  │  Quick Actions                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Section Reference

| Section | Component | Status |
|---------|-----------|--------|
| 1. Header | `DomainDashboardLayout` + `DashboardHeaderBar` | ✅ Shipped |
| 2. Key Metrics | `BentoKpiDeck` + `KPICard` | ✅ Shipped |
| 3. Charts & Diagrams | `DashboardVisualsSection` | ✅ Shipped |
| 4. Separator | `DomainDashboardLayout` | ✅ Shipped |
| 5. Features & Functions | `FeatureGrid` | ✅ Shipped |
| 6. Attention | `DashboardAttentionSection` → `AttentionPanel` | ✅ Shipped (finance page) |
| 7. Activity + Quick Actions | `DashboardActivityFeed`, `DashboardQuickActionsSection` | ✅ Shipped (finance page) |

---

## Phased Roadmap

### Phase 1: Quick Wins ✅ Shipped

| # | Improvement | Source Files |
|---|-------------|--------------|
| 1 | Time-range selector (MTD/QTD/YTD) | `dashboard-header-bar.client.tsx`, `user-preferences.ts` |
| 2 | Semantic grouping labels | `kpi-card.tsx`, `kpi-catalog.ts` |
| 3 | Hero metric (first card 2×1) | `bento-kpi-deck.client.tsx` |
| 4 | Plain language toggle | `dashboard-header-bar.client.tsx`, `kpi-catalog.ts` |

### Phase 2: Actionability & Trust ✅ Shipped

| # | Improvement | Source Files |
|---|-------------|--------------|
| 5 | Status badges (On track / At risk / Overdue) | `kpi-card.tsx`, `kpi-registry.server.ts` |
| 6 | Quick action buttons on cards | `kpi-card.tsx`, `kpi-catalog.ts`, `constants.ts` |
| 7 | Drill-down from card | `kpi-card.tsx` |
| 8 | Sparklines in value-trend cards | `kpi-card.tsx`, `kpi-registry.server.ts` |

### Phase 3: KPI Catalog Robustness ✅ Shipped

| # | Improvement | Source Files | Status |
|---|-------------|--------------|--------|
| 9 | `description` tooltip on every KPI | `kpi-catalog.ts`, `kpi-card.tsx` | ✅ |
| 10 | `quickActions[]` (multiple per card) | `kpi-catalog.ts`, `kpi-card.tsx` | ✅ |
| 11 | `tags`, `displayPriority`, `heroEligible` | `kpi-catalog.ts` | ✅ |
| 12 | `module`, `category` for organization | `kpi-catalog.ts`, `domain-configs.ts` | ✅ |
| 13 | `drillTargets[]` (multiple drill links) | `kpi-catalog.ts`, `kpi-card.tsx` | ✅ |
| 14 | `thresholds`, `targetValue` for bullet/dial | `kpi-catalog.ts`, `kpi-registry.server.ts`, `kpi-card.tsx` | ✅ |
| 15 | Catalog validation (catalog ↔ registry alignment) | `kpi-catalog.validate.ts` | ✅ |

### Phase 4: Personalization & Flexibility ✅ Shipped

| # | Improvement | Source Files | Status |
|---|-------------|--------------|--------|
| 16 | Role-based default KPIs | `domain-configs.ts` defaultKpiIdsByRole, `domain-dashboard-shell.tsx`, `kernel-guards.ts` getOrgRoleForDashboard | ✅ |
| 17 | Saved views (named presets) | `user-preferences.ts`, `dashboard-header-bar.client.tsx`, `domain-configs.ts`, `domain-dashboard-shell.tsx`, `widget-config-dialog.client.tsx` | ✅ |
| 18 | Comparison mode (vs plan, vs prior, vs budget) | `user-preferences.ts`, `dashboard-header-bar.client.tsx`, `kpi-registry.server.ts`, `kpi-card.tsx` | ✅ |
| 19 | Empty states with guided onboarding | `kpi-catalog.ts`, `kpi-card.tsx`, `kpi-registry.server.ts` | ✅ |

### Phase 5: Polish & Zoho-Inspired ✅ Shipped

| # | Improvement | Source Files | Status |
|---|-------------|--------------|--------|
| 20 | Bullet / dial / speedometer templates | `kpi-catalog.ts`, `kpi-card.tsx` | ✅ |
| 21 | Responsive grid (4→2→1 columns) | `bento-kpi-deck.client.tsx` | ✅ |
| 22 | Skeleton loading refinement | `domain-dashboard-shell.tsx`, `loading-skeleton.tsx` | ✅ |
| 23 | `searchKeywords` for discoverability | `kpi-catalog.ts`, `widget-config-dialog.client.tsx` | ✅ |
| 24 | Alert config (threshold-based) | `kpi-catalog.ts`, `kpi-alert.service.ts`, `domain-dashboard-shell.tsx` | ✅ |

---

## Implementation Checklist

### Shipped ✅

- [x] Bento grid with drag-and-drop
- [x] Resize cards (1×1 to 2×2)
- [x] Layout persisted to user preferences
- [x] ERPNext-style layout (separator, Features & Functions at bottom)
- [x] Configurable KPI cards (up to 8)
- [x] Configurable chart + diagram (1 each)
- [x] Collapsible Key Metrics section
- [x] Time-range selector (MTD/QTD/YTD)
- [x] Semantic grouping labels (Cash, Receivables, Payables, Operations)
- [x] Hero metric emphasis (first card 2×1 when no saved layout)
- [x] Plain language toggle
- [x] Status badges on cards ("On track" / "At risk" / "Overdue")
- [x] Quick action buttons on cards (Reconcile, New Invoice, Record Bill)
- [x] Drill-down from card (detail view)
- [x] Sparklines in value-trend cards

### Phase 3 — KPI Catalog Robustness ✅

- [x] `description` tooltip on every catalog entry
- [x] `quickActions[]` (multiple actions per card)
- [x] `tags`, `displayPriority`, `heroEligible`
- [x] `module`, `category` for organization
- [x] `drillTargets[]` (multiple drill links per card)
- [x] `thresholds`, `targetValue` for bullet/dial templates
- [x] Catalog validation (catalog ↔ registry alignment)

### Phase 4 — Personalization & Flexibility ✅

- [x] Role-based default KPIs
- [x] Saved views (named presets)
- [x] Comparison mode (vs plan, vs prior, vs budget)
- [x] Empty states with guided onboarding

### Phase 5 — Polish & Zoho-Inspired ✅

- [x] Bullet / dial / speedometer widget templates
- [x] Responsive grid (4→2→1 columns)
- [x] Skeleton loading refinement
- [x] `searchKeywords` for configure dialog search
- [x] Alert config (threshold-based notifications)

### Planned Sections

- [x] Attention Items panel (overdue, blocked) — `DashboardAttentionSection` on finance page
- [x] Activity Feed — `DashboardActivityFeed` on finance page
- [x] Quick Actions panel (bottom) — `DashboardQuickActionsSection` on finance page

---

## Validation Log (Last Verified)

| Phase | Item | Codebase Check | Status |
|-------|------|----------------|--------|
| 1 | Time-range selector | `dashboard-header-bar.client.tsx` Tabs (mtd/qtd/ytd), `user-preferences.ts` TimeRangeSchema | ✅ |
| 1 | Semantic grouping | `kpi-card.tsx` GROUP_LABELS, catalog.group | ✅ |
| 1 | Hero metric | `bento-kpi-deck.client.tsx` isHero, w:2 for first card | ✅ |
| 1 | Plain language | `dashboard-header-bar.client.tsx` Switch, catalog.plainTitle | ✅ |
| 2 | Status badges | `kpi-card.tsx` INDICATOR_* , `kpi-registry.server.ts` indicator | ✅ |
| 2 | Quick actions | `kpi-card.tsx` getQuickActions, catalog quickActions | ✅ |
| 2 | Drill-down | `kpi-card.tsx` href, "View details" link | ✅ |
| 2 | Sparklines | `kpi-card.tsx` MiniSparkline, ValueTrendTemplate | ✅ |
| 3 | description tooltip | `kpi-card.tsx` Info + Tooltip, catalog.description on all entries | ✅ |
| 3 | quickActions[] | `kpi-catalog.ts` getQuickActions, multiple per card | ✅ |
| 3 | tags, displayPriority, heroEligible | `kpi-catalog.ts` on entries | ✅ |
| 3 | module, category | `kpi-catalog.ts` on entries | ✅ |
| 3 | drillTargets[], thresholds | `kpi-catalog.ts` drillTargets, targetValue, thresholds; `kpi-card.tsx` dropdown | ✅ |
| 3 | Catalog validation | `kpi-catalog.validate.ts` exists | ✅ |
| 4 | Saved views | `savedViewId`, `savedViewPresets`, header Select | ✅ |
| 4 | Empty states | `catalog.emptyState`, `data.isEmpty`, KPICard render | ✅ |
| 4 | Role-based defaults | `defaultKpiIdsByRole`, `getOrgRoleForDashboard`, domain-dashboard-shell | ✅ |
| 4 | Comparison mode | `comparisonMode` in prefs, header Select, KPIResolverResult.comparison, kpi-card | ✅ |
| 5 | Bullet template | `kpi-card.tsx` BulletTemplate, fin.ap.total template: bullet | ✅ |
| 5 | Dial template | `kpi-card.tsx` DialTemplate, fin.bank.balance template: dial | ✅ |
| 5 | Speedometer template | `kpi-card.tsx` SpeedometerTemplate | ✅ |
| 5 | Alert config | `kpi-catalog.ts` alertConfig, `kpi-alert.service.ts`, domain-dashboard-shell | ✅ |
| Sections | Attention, Activity, Quick Actions | `dashboard-sections.tsx`, finance page | ✅ |

---

## Summary

**Northstar:** A finance dashboard that combines NetSuite (time ranges, drill-down, comparison), SAP Fiori (grouping, actionable tiles), QuickBooks/Xero (plain language, hero metrics), Dynamics 365 (status badges, saved views), Zoho (tooltips, targets, thresholds, drill-through, role-based access), and Stripe (sparklines, empty states, performance) — with our differentiator: **bento grid + ERPNext-style layout**.

**Next steps:** Phase 5 complete. All phases 1–5 shipped. Bullet/dial/speedometer templates, alert config, KpiDeckSkeleton/ChartsSkeleton centralized.

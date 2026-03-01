# Finance Domain Dashboard — Optimization Audit

**Date:** 2026-03-01  
**Scope:** Runtime, routes, performance, API, features, stability  
**Skills applied:** vercel-react-best-practices, next-best-practices

---

## Executive Summary

The finance dashboard (`/finance`) was evaluated against Vercel React best practices. Several optimizations were implemented to eliminate waterfalls, reduce re-renders, and improve stability. The dashboard already had good foundations: Suspense boundaries, `force-dynamic` for fresh data, and `optimizePackageImports` for lucide-react.

---

## 1. Architecture Overview

### Route & Layout

| Layer | Path | Responsibility |
|-------|------|----------------|
| Page | `(shell)/(erp)/finance/page.tsx` | Composes DomainDashboardShell + Attention + Activity + QuickActions |
| Shell | `domain-dashboard-shell.tsx` | Prefs, role, KPI deck orchestration |
| KPI Deck | `KpiDeckLoader` → `BentoKpiDeck` | KPIs, charts, diagrams in bento grid |

### Data Flow (Post-Optimization)

```
getRequestContext (cached via React.cache)
  └─ Promise.all([
       prefs (api.get /me/preferences),
       getOrgRoleForDashboard()
     ])
  └─ KpiDeckLoader (Suspense)
       └─ Promise.all([
            resolveKPIs(activeKpiIds),
            fetchChartData(selectedChartId),
            fetchDiagramData(selectedDiagramId)
          ])
```

---

## 2. Optimizations Implemented

### 2.1 Eliminate Waterfalls (CRITICAL)

**Before:** Sequential fetches in KpiDeckLoader:
1. resolveKPIs → 2. fetchChartData + fetchDiagramData

**After:** All three run in parallel via `Promise.all`:
- KPIs, chart, and diagram data load concurrently
- **Impact:** ~2× faster KPI deck load when chart/diagram APIs are slow

### 2.2 Parallel Prefs + Role (HIGH)

**Before:** Prefs fetched, then role fetched inside KpiDeckLoader when needed.

**After:** Prefs and role fetched in parallel in DomainDashboardShell via `Promise.all`. Role passed as prop to KpiDeckLoader.
- **Impact:** Saves one round-trip for first-time users (no preset, no selectedWidgetIds)

### 2.3 Responsive Cols: matchMedia (MEDIUM)

**Before:** `window.addEventListener('resize')` — re-renders on every pixel change.

**After:** `window.matchMedia('(min-width: 1024px)')` and `(min-width: 640px)` — re-renders only when crossing breakpoints.
- **Impact:** Fewer re-renders during window resize; better scroll performance

---

## 3. Existing Good Practices (No Changes)

| Practice | Location | Benefit |
|----------|----------|---------|
| `React.cache()` for getRequestContext | `lib/auth.ts` | Per-request deduplication |
| `optimizePackageImports` for lucide-react | `next.config.ts` | Smaller bundle, faster imports |
| Suspense boundaries | Finance page | Attention, Activity, QuickActions stream independently |
| `force-dynamic` + `revalidate: 0` | Finance page | Fresh data for dashboard |
| `resolveKPIs` uses `Promise.allSettled` | kpi-registry.server.ts | KPIs resolve in parallel |
| Error boundary | `finance/error.tsx` | Graceful degradation |
| Loading skeleton | `finance/loading.tsx` | Instant navigation feedback |

---

## 4. API & Features

### Chart/Diagram Data

- **Source:** `dashboard-chart-data.server.ts` — API-first with stub fallback
- **Endpoints:** `/dashboard/cash-flow-chart`, `/dashboard/revenue-expense-chart`, `/dashboard/ar-aging-chart`, `/dashboard/ap-aging-chart`
- **Fallback:** AR/AP aging try `/ar/aging` and `/ap/aging` if dashboard endpoints fail

### KPI Resolvers

- **Source:** `kpi-registry.server.ts` — stub data + some real (e.g. `fin.ap.discount` via `getApDiscountSummary`)
- **Comparison mode:** `vs_prior_period`, `vs_budget`, `vs_plan` supported

### saveDashboardPrefs (Server Action)

- **Flow:** Read current prefs → deep-merge domain → PATCH `/me/preferences` → `revalidatePath('/finance')`
- **Stability:** Catches errors, logs, never throws to client (best-effort)

---

## 5. Recommendations (Future)

1. **LRU cache for chart data** — If same chart requested across users within TTL, cache server-side (vercel-react-best-practices: server-cache-lru)
2. **Dynamic import for react-grid-layout** — Consider `next/dynamic` for BentoKpiDeck if bundle size becomes an issue (currently acceptable)
3. **SWR for client-side pref updates** — Avoid full page reload on config dialog Apply (widget-config-dialog uses `window.location.reload()`)
4. **after() for processKpiAlerts** — Fire-and-forget alert processing could use Next.js `after()` to not block response

---

## 6. Stability Checklist

- [x] getRequestContext cached (no duplicate auth)
- [x] KPI resolvers catch errors, return stub (AD-DASH-04)
- [x] saveDashboardPrefs catches, logs, never throws
- [x] Chart/diagram fetchers fallback to stub on API failure
- [x] Finance error boundary with ErrorDisplay + reportError
- [x] Loading skeleton for instant feedback



  

Research prefs & permissions

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/services/kernel/user-preferences.service.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/modules/types.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/components/erp/dashboard-page.tsx)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/kpis/kpi-registry.server.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/components/erp/kpi-card.tsx)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/modules/module-definitions.server.ts)

Searched for text `preferences` (`**/apps/api/src/**/*.ts`), 20 results

Searched for text `preferences` (`**/apps/web/src/lib/**`), 20 results

Searched for text `preferences` (`**/apps/web/src/features/**`), 10 results

Searched for files matching `**/apps/web/src/app/(shell)/**/_components/**`, 17 matches

Searched for files matching `**/apps/web/src/features/finance/dashboard/**`, 7 matches

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/routes/kernel-settings.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/kernel-actions.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/types.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/queries/dashboard.queries.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/blocks/dashboard-sections.tsx)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/shell/shell-preferences.types.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/kpis/kpi-catalog.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/api-client.ts#1-1), lines 1 to 80

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/blocks/dashboard-charts.tsx#1-1), lines 1 to 100

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/blocks/attention-panel.tsx#1-1), lines 1 to 100

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/blocks/activity-feed.tsx#1-1), lines 1 to 100

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/features/finance/dashboard/blocks/quick-actions.tsx)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/api-client.ts#80-80), lines 80 to 192

Searched for regex `UserPreferencesSchema|UpdateUserPreferences|UserPreferences` (`**/packages/contracts/**`), 20 results

Searched for text `_components` (`**/apps/web/src/app/(shell)/(erp)/**`), no results

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/packages/contracts/src/kernel/user-preferences.ts)

Searched for files matching `**/apps/web/src/app/(shell)/(erp)/**/_components/**`, no matches

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/lib/modules/module-spec.ts)

Read [](file:///c%3A/Users/dlbja/AppData/Roaming/Code/User/workspaceStorage/ddf2e50521e37c259b749a3efe1fdea0/GitHub.copilot-chat/chat-session-resources/b1f0161e-2ba2-4286-bad5-177213c1e634/toolu_vrtx_013PDyewVcZEYxGWUxdLtMyX__vscode-1772280764252/content.txt#1-1), lines 1 to 300

Now I have the complete picture. Let me also quickly check the `UserPreferences` schema to understand how to extend it for dashboard prefs:  

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/packages/contracts/src/kernel/user-preferences.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/components/erp/dashboard-page.tsx#1-1), lines 1 to 120

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/components/erp/dashboard-page.tsx#120-120), lines 120 to 142

Now let me check the attention registry integration to understand how feature cards can show attention badges:   

Searched for text `export` (`**/apps/web/src/components/erp/shortcut-grid.tsx`), 2 results

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/src/components/erp/shortcut-grid.tsx#1-1), lines 1 to 68

I now have complete context. Here's the refined plan:

---

## Refined Plan: Zoho-Inspired Domain Dashboard System

### Summary

Build a two-panel, user-configurable domain dashboard system. Top panel: KPI deck (server-resolved, user-selectable). Bottom panel: feature card grid. **Catalog = truth, domain config = composition, prefs = user choice.** Dashboard prefs persist via API (`/me/preferences` → `tablePresets` record), cached optimistically in localStorage. Server renders initial layout from API prefs — no FOUC.

---

### Steps

**Step 1 — Create `(shell)/_components/dashboards/` directory**

New shared primitives (6 files):

| File | Type | Role |
|---|---|---|
| `domain-dashboard-layout.tsx` | Server | Two-panel frame: `kpiSlot` (top) + `Separator` + `featureSlot` (bottom). Accepts `topCollapsed` boolean from prefs for initial render. |
| `domain-dashboard-shell.tsx` | Server | Orchestrator: reads `DashboardScope` → loads prefs from API via `createApiClient(ctx).get('/me/preferences')` → batch-resolves KPIs via `resolveKPIs()` → passes `initialPrefs` + `resolvedKpis` + `catalogEntries` to `KPIDeck` client. |
| `kpi-deck.client.tsx` | Client | Renders KPI card grid from `initialPrefs` (SSR-safe). Toggle visibility, reorder. Calls `WidgetConfigDialog` to edit. `initialPrefs` prop = server truth → no hydration mismatch. |
| `widget-config-dialog.client.tsx` | Client | Popover/dialog: checkbox list of available KPIs, reorder arrows, template override per widget. Saves via server action that patches `/me/preferences`. |
| `feature-grid.tsx` | Server | Bottom panel: grid of `FeatureCard` linking to sub-domain routes. Accepts `FeatureRouteCard[]`. |
| `feature-card.tsx` | Server | Individual card: `<Link>` + icon + title + description + optional attention badge count. Pure server — no interactivity needed. |

**Step 2 — Add `dashboards` field to `UserPreferencesSchema`**

In user-preferences.ts, add a new field to the schema alongside `tablePresets`:

```
dashboards: z.record(z.string(), DashboardPrefsSchema).default({})
```

Where `DashboardPrefsSchema` validates:
- `selectedWidgetIds: string[]` — which KPIs are active (from the domain's pool)
- `widgetOrder: string[]` — display order
- `templateOverrides: Record<string, KPITemplate>` — per-widget template choice
- `topCollapsed: boolean` — whether KPI deck is collapsed

Key format: `finance.ap`, `finance.ar`, `finance.gl`, etc. Company-scoped variant: `finance.ap:<companyId>` when multi-company dashboards differ.

This uses the existing `PATCH /me/preferences` endpoint — no new API route needed.

**Step 3 — Create domain dashboard configs**

New directory: `apps/web/src/features/finance/dashboard/dashboard-configs/`

One file per domain (15 total). Each exports a `DomainDashboardConfig`:

```ts
interface DomainDashboardConfig {
  domainId: string;               // 'finance.ap'
  label: string;                  // 'Accounts Payable'
  availableWidgetIds: string[];   // pool: all KPIs user can pick from
  defaultWidgetIds: string[];     // initial 4 shown if no prefs saved
  featureRoutes: FeatureRouteCard[]; // bottom panel entries
}

interface FeatureRouteCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  attentionKey?: string;          // maps to attention registry for badge count
}
```

Example: `finance-ap.config.ts` declares `availableWidgetIds: ['fin.ap.total', 'fin.ap.aging', 'fin.ap.overdue', 'fin.ap.pending']`, `defaultWidgetIds: ['fin.ap.total', 'fin.ap.aging', 'fin.ap.overdue', 'fin.ap.pending']`, and `featureRoutes` pointing to `/finance/payables`, `/finance/payables/payment-runs`, `/finance/payables/suppliers`, etc.

**Step 4 — Build `DomainDashboardShell` (the orchestrator)**

Server component flow:
1. Accept `config: DomainDashboardConfig` prop
2. Call `getRequestContext()` → `createApiClient(ctx).get('/me/preferences')` → extract `dashboards[config.domainId]` (or defaults)
3. Compute effective `kpiIds` = user's `selectedWidgetIds` ?? `config.defaultWidgetIds`
4. Batch-resolve via `resolveKPIs(kpiIds, ctx)` (one call, not N+1)
5. Get catalog entries via `getKPICatalogEntries(kpiIds)`
6. Render `<DomainDashboardLayout>` passing:
   - Top: `<Suspense>` → `<KPIDeck initialPrefs={prefs} resolvedKpis={data} catalog={entries} config={config} />`
   - Bottom: `<FeatureGrid routes={config.featureRoutes} />`

**Step 5 — Wire `KPIDeck` client component**

Props: `initialPrefs` (from server — SSR match guaranteed), `resolvedKpis`, `catalog`, `config` (available pool for configure dialog).

- Renders KPI cards in `initialPrefs.widgetOrder` using existing `KPICard` component
- "Configure" gear icon in header → opens `WidgetConfigDialog`
- "Collapse" chevron → toggles top panel (persists via server action)
- Template overrides: if user chose `aging` instead of `value-trend` for a specific KPI, the deck passes the override to `KPICard`

**Step 6 — Create server action for dashboard pref persistence**

In `apps/web/src/lib/dashboard-actions.ts`:
- `saveDashboardPrefs(domainId: string, prefs: DashboardPrefs)` — server action that calls `PATCH /me/preferences` with `dashboards: { [domainId]: prefs }` merge-patch
- Optimistic: `KPIDeck` also writes to localStorage for instant visual feedback, but API is source of truth

**Step 7 — Permission-aware widget filtering**

In `DomainDashboardShell`, after resolving KPIs, check each `KPIResolverResult.status`. If `status === 'error'`, render a "Restricted" placeholder card (existing pattern — `resolveKPIs` already returns error stubs via `Promise.allSettled`). No crash, no leaked data.

**Step 8 — Replace route group page.tsx stubs**

Start with page.tsx:

```tsx
import { DomainDashboardShell } from '@/app/(shell)/_components/dashboards/domain-dashboard-shell';
import { AP_DASHBOARD_CONFIG } from '@/features/finance/dashboard/dashboard-configs/finance-ap.config';

export default function AccountsPayablePage() {
  return <DomainDashboardShell config={AP_DASHBOARD_CONFIG} />;
}
```

Then roll across the other 14 groups — each page imports its config file, one-liner render.

**Step 9 — Density-aware KPI grid**

The `KPIDeck` reads `density` from shell preferences (already available via cookie). Grid columns adapt:
- `default` / `touch`: `sm:grid-cols-2 lg:grid-cols-4`
- `compact` / `ultra`: `sm:grid-cols-3 lg:grid-cols-6`

**Step 10 — Attention badge integration on feature cards**

`FeatureGrid` receives optional attention summary (from `resolveAttentionSummary`). Each `FeatureCard` with an `attentionKey` gets a badge count if a matching attention item exists. Existing `AttentionSeverity` colors apply.

---

### Verification

1. Build passes: `pnpm --filter @afenda/web build` — no type errors from new components or schema changes
2. Hydration check: server-rendered KPI layout matches client initial render (both use `initialPrefs` from API, not localStorage)
3. Preference round-trip: configure dialog → save → refresh page → same layout renders (API-backed)
4. N+1 check: one `resolveKPIs()` call per dashboard, not per widget
5. Permission check: KPIs with `status: 'error'` show placeholder, not crash
6. Manual test: navigate to `/finance/payables` → see KPI deck (top) + feature grid (bottom) + separator

---

### Decisions

- **API prefs over localStorage-only**: Dashboard config roams across devices, supports admin audit/reset. LocalStorage used only as optimistic cache for instant feedback.
- **Extend `UserPreferencesSchema.dashboards` over new table**: Avoids schema migration; `dashboards` field is a JSON record keyed by domain ID — same merge-patch pattern as existing `tablePresets`.
- **Keep `KPICatalogEntry` untouched**: No `availableFormulas` or `compatibleTemplates` on the catalog. Domain configs declare the widget pool; template overrides live in user prefs. Catalog stays as "business truth".
- **`DOMAIN_CONFIGS` in dashboard-page.tsx will be deprecated**: Replaced by per-domain config files in `features/finance/dashboard/dashboard-configs/`. Migration: update `DashboardPage` to look there or keep both briefly.
- **Collapse first, resize later**: Ship with `topCollapsed` toggle on separator. Resizable panels behind a future feature flag.
- **Company-scoped prefs**: Key format `finance.ap:<companyId>` when needed. Phase 1 uses just `finance.ap` (no company suffix).
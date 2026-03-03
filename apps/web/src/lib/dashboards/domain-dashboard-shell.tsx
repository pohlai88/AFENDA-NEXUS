import * as React from 'react';
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getOrgRoleForDashboard } from '@/lib/kernel-guards';
import { createApiClient } from '@/lib/api-client';
import { resolveKPIs } from '@/lib/kpis/kpi-registry.server';
import { getKPICatalogEntries } from '@/lib/kpis/kpi-catalog';
import { processKpiAlerts } from '@/lib/kpis/kpi-alert.service';
import { DomainDashboardLayout } from './domain-dashboard-layout';
import { FeatureGrid } from './feature-grid';
import { BentoKpiDeck } from './bento-kpi-deck.client';
import { DashboardHeaderBar } from './dashboard-header-bar.client';
import { WidgetConfigDialog } from './widget-config-dialog.client';
import { fetchChartData, fetchDiagramData } from './dashboard-chart-data.server';
import { CHART_DIAGRAM_NONE } from './chart-registry';
import { KpiDeckSkeleton } from '@/components/erp/loading-skeleton';
import { saveDashboardPrefs } from './actions';
import type { DomainDashboardConfig } from './types';
import type { UserPreferences, DashboardPrefs } from '@afenda/contracts';

// ─── Domain Dashboard Shell (Server Component) ─────────────────────────────
// Top-level orchestrator for domain dashboards.
//
// Server responsibilities:
//   1. Load user dashboard preferences from API (once, shared)
//   2. Determine active KPI IDs (user prefs → config defaults)
//   3. Batch-resolve KPIs via resolveKPIs()
//   4. Look up catalog entries
//   5. Compose layout: KpiDeck (client) + FeatureGrid (server)
//
// Optimized per vercel-react-best-practices:
//   - async-parallel: Single prefs fetch, parallel chart/diagram fetches
//   - server-parallel-fetching: Prefs + role in parallel where possible

interface DomainDashboardShellProps {
  /** Static domain configuration. */
  config: DomainDashboardConfig;
}

export async function DomainDashboardShell({ config }: DomainDashboardShellProps) {
  const ctx = await getRequestContext();

  // 1. Load prefs, role, attention items, and feature metrics in parallel (async-parallel)
  const [prefs, role, attentionItems, featureMetrics] = await Promise.all([
    (async () => {
      try {
        const api = createApiClient(ctx);
        const result = await api.get<UserPreferences>('/me/preferences');
        return result.ok ? (result.value.dashboards?.[config.domainId] ?? {}) : {};
      } catch {
        return {} as DashboardPrefs;
      }
    })(),
    getOrgRoleForDashboard(),
    config.buildAttentionItems?.(ctx) ?? Promise.resolve([]),
    config.buildFeatureMetrics?.(ctx) ?? Promise.resolve({}),
  ]);

  return (
    <DomainDashboardLayout
      title={config.title}
      description={config.description}
      headerBar={
        <DashboardHeaderBar
          domainId={config.domainId}
          savedViewPresets={config.savedViewPresets}
          prefs={prefs}
          onSavePrefs={saveDashboardPrefs}
        />
      }
      kpiDeck={
        <Suspense fallback={<KpiDeckSkeleton count={config.defaultKpiIds.length} />}>
          <KpiDeckLoader config={config} prefs={prefs} role={role} />
        </Suspense>
      }
      featureGrid={
        <FeatureGrid
          navGroups={config.navGroups}
          moduleId={config.domainId}
          attentionItems={attentionItems}
          featureMetrics={featureMetrics}
        />
      }
    />
  );
}

// ─── Async KPI Deck Loader ──────────────────────────────────────────────────
// Receives prefs from parent (no duplicate fetch). Resolves KPIs, fetches
// chart/diagram data in parallel (async-parallel), renders BentoKpiDeck.

async function KpiDeckLoader({
  config,
  prefs,
  role,
}: {
  config: DomainDashboardConfig;
  prefs: DashboardPrefs;
  role: 'owner' | 'admin' | 'member' | string;
}) {
  const ctx = await getRequestContext();

  // 2. Determine active KPI IDs (saved view preset → custom → role-based defaults → config defaults)
  let activeKpiIds: string[];
  const preset =
    prefs.savedViewId &&
    prefs.savedViewId !== 'custom' &&
    config.savedViewPresets?.find((p) => p.id === prefs.savedViewId);
  if (preset) {
    activeKpiIds = preset.widgetIds;
  } else if (prefs.selectedWidgetIds && prefs.selectedWidgetIds.length > 0) {
    activeKpiIds = prefs.selectedWidgetIds;
  } else {
    const roleKey =
      role === 'owner' || role === 'admin' ? (role as 'owner' | 'admin' | 'member') : 'member';
    const roleDefaults = config.defaultKpiIdsByRole?.[roleKey];
    activeKpiIds = roleDefaults ?? config.defaultKpiIds;
  }
  if (config.maxWidgets && activeKpiIds.length > config.maxWidgets) {
    activeKpiIds = activeKpiIds.slice(0, config.maxWidgets);
  }

  // 3–6. Chart/diagram selection (sync, needed for parallel fetches)
  const chartSlotIds = config.chartSlotIds ?? [];
  const diagramSlotIds = config.diagramSlotIds ?? [];
  let selectedChartId: string | null = chartSlotIds[0] ?? null;
  let selectedDiagramId: string | null = diagramSlotIds[0] ?? null;
  if (prefs.selectedChartId === CHART_DIAGRAM_NONE) selectedChartId = null;
  else if (prefs.selectedChartId && chartSlotIds.includes(prefs.selectedChartId)) {
    selectedChartId = prefs.selectedChartId;
  }
  if (prefs.selectedDiagramId === CHART_DIAGRAM_NONE) selectedDiagramId = null;
  else if (prefs.selectedDiagramId && diagramSlotIds.includes(prefs.selectedDiagramId)) {
    selectedDiagramId = prefs.selectedDiagramId;
  }

  const comparisonMode =
    prefs.comparisonMode && prefs.comparisonMode !== 'none' ? prefs.comparisonMode : undefined;

  const timeRange = (prefs.timeRange ?? 'mtd') as 'mtd' | 'qtd' | 'ytd' | 'custom';

  // 4. Resolve KPIs + chart + diagram in parallel (async-parallel) — eliminates waterfall
  const [resolvedKpis, chartData, diagramData] = await Promise.all([
    resolveKPIs(activeKpiIds, ctx, { comparisonMode, timeRange }),
    selectedChartId
      ? fetchChartData(selectedChartId, {
          userId: ctx.userId,
          tenantId: ctx.tenantId,
          token: ctx.token,
        })
      : Promise.resolve(null),
    selectedDiagramId
      ? fetchDiagramData(selectedDiagramId, {
          userId: ctx.userId,
          tenantId: ctx.tenantId,
          token: ctx.token,
        })
      : Promise.resolve(null),
  ]);

  // 5. Look up catalog entries (active + all available)
  const activeCatalog = getKPICatalogEntries(activeKpiIds);
  const availableKpiIds = config.availableKpiIds ?? config.defaultKpiIds;
  const availableCatalog = getKPICatalogEntries(availableKpiIds);

  // 6. Check threshold alerts (fire-and-forget; stub logs in dev)
  const catalogById = new Map(activeCatalog.map((c) => [c.id, c]));
  const dataById = new Map(resolvedKpis.map((d) => [d.id, d]));
  const alertEntries = activeKpiIds
    .map((id) => {
      const catalog = catalogById.get(id);
      const data = dataById.get(id);
      return catalog && data ? { catalog, data } : null;
    })
    .filter(
      (e): e is { catalog: (typeof activeCatalog)[0]; data: (typeof resolvedKpis)[0] } => e != null
    );
  void processKpiAlerts(alertEntries);

  // Construct chart/diagram slots arrays (no push mutations - RBP-03)
  const chartSlots: { id: string; data: unknown }[] =
    selectedChartId && chartData ? [{ id: selectedChartId, data: chartData }] : [];
  const diagramSlots: { id: string; data: unknown }[] =
    selectedDiagramId && diagramData ? [{ id: selectedDiagramId, data: diagramData }] : [];

  return (
    <BentoKpiDeck
      domainId={config.domainId}
      catalog={activeCatalog}
      resolvedKpis={resolvedKpis}
      prefs={prefs}
      onSavePrefs={saveDashboardPrefs}
      chartSlots={chartSlots}
      diagramSlots={diagramSlots}
      configDialog={
        <WidgetConfigDialog
          domainId={config.domainId}
          availableCatalog={availableCatalog}
          activeKpiIds={activeKpiIds}
          defaultKpiIds={config.defaultKpiIds}
          maxWidgets={config.maxWidgets}
          chartSlotIds={config.chartSlotIds}
          diagramSlotIds={config.diagramSlotIds}
          prefs={prefs}
          onSavePrefs={saveDashboardPrefs}
        />
      }
    />
  );
}

export type { DomainDashboardShellProps };

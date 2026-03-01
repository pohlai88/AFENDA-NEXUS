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
import { DashboardVisualsSection } from './dashboard-visuals-section';
import { KpiDeckSkeleton, ChartsSkeleton } from '@/components/erp/loading-skeleton';
import { saveDashboardPrefs } from './actions';
import type { DomainDashboardConfig } from './types';
import type { UserPreferences, DashboardPrefs } from '@afenda/contracts';

// ─── Domain Dashboard Shell (Server Component) ─────────────────────────────
// Top-level orchestrator for domain dashboards.
//
// Server responsibilities:
//   1. Load user dashboard preferences from API
//   2. Determine active KPI IDs (user prefs → config defaults)
//   3. Batch-resolve KPIs via resolveKPIs()
//   4. Look up catalog entries
//   5. Compose layout: KpiDeck (client) + FeatureGrid (server)
//
// The client NEVER calls resolvers or fetches prefs.

interface DomainDashboardShellProps {
  /** Static domain configuration. */
  config: DomainDashboardConfig;
}

const hasVisuals = (c: DomainDashboardConfig) =>
  (c.chartSlotIds?.length ?? 0) > 0 || (c.diagramSlotIds?.length ?? 0) > 0;

export async function DomainDashboardShell({ config }: DomainDashboardShellProps) {
  return (
    <DomainDashboardLayout
      title={config.title}
      description={config.description}
      headerBar={
        <Suspense fallback={null}>
          <DashboardHeaderBarLoader config={config} />
        </Suspense>
      }
      kpiDeck={
        <Suspense fallback={<KpiDeckSkeleton count={config.defaultKpiIds.length} />}>
          <KpiDeckLoader config={config} />
        </Suspense>
      }
      featureGrid={<FeatureGrid navGroups={config.navGroups} />}
      visualsSection={
        hasVisuals(config) ? (
          <Suspense fallback={<ChartsSkeleton />}>
            <DashboardVisualsSection config={config} />
          </Suspense>
        ) : undefined
      }
    />
  );
}

// ─── Async Header Bar Loader ─────────────────────────────────────────────────
// Loads prefs and renders the header bar (time range, plain language).

async function DashboardHeaderBarLoader({
  config,
}: {
  config: DomainDashboardConfig;
}) {
  const ctx = await getRequestContext();
  let prefs: DashboardPrefs = {};
  try {
    const api = createApiClient(ctx);
    const result = await api.get<UserPreferences>('/me/preferences');
    if (result.ok) {
      prefs = result.value.dashboards?.[config.domainId] ?? {};
    }
  } catch {
    // Prefs unavailable — use defaults
  }
  return (
    <DashboardHeaderBar
      domainId={config.domainId}
      config={config}
      prefs={prefs}
      onSavePrefs={saveDashboardPrefs}
    />
  );
}

// ─── Async KPI Deck Loader ──────────────────────────────────────────────────
// Isolated async boundary — loads prefs + resolves KPIs, then renders
// the client-side KpiDeck with all data pre-fetched.

async function KpiDeckLoader({ config }: { config: DomainDashboardConfig }) {
  const ctx = await getRequestContext();

  // 1. Load user dashboard preferences (best-effort)
  let prefs: DashboardPrefs = {};
  try {
    const api = createApiClient(ctx);
    const result = await api.get<UserPreferences>('/me/preferences');
    if (result.ok) {
      prefs = result.value.dashboards?.[config.domainId] ?? {};
    }
  } catch {
    // Prefs unavailable — use defaults silently
  }

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
    const role = await getOrgRoleForDashboard();
    const roleKey =
      role === 'owner' || role === 'admin' ? role : 'member';
    const roleDefaults = config.defaultKpiIdsByRole?.[roleKey];
    activeKpiIds = roleDefaults ?? config.defaultKpiIds;
  }
  if (config.maxWidgets && activeKpiIds.length > config.maxWidgets) {
    activeKpiIds = activeKpiIds.slice(0, config.maxWidgets);
  }

  // 3. Batch-resolve KPIs (pass comparisonMode for vs prior/budget/plan)
  const comparisonMode =
    prefs.comparisonMode && prefs.comparisonMode !== 'none'
      ? prefs.comparisonMode
      : undefined;
  const resolvedKpis = await resolveKPIs(activeKpiIds, ctx, { comparisonMode });

  // 4. Look up catalog entries (active + all available)
  const activeCatalog = getKPICatalogEntries(activeKpiIds);
  const availableKpiIds = config.availableKpiIds ?? config.defaultKpiIds;
  const availableCatalog = getKPICatalogEntries(availableKpiIds);

  // 5. Check threshold alerts (fire-and-forget; stub logs in dev)
  const catalogById = new Map(activeCatalog.map((c) => [c.id, c]));
  const dataById = new Map(resolvedKpis.map((d) => [d.id, d]));
  const alertEntries = activeKpiIds
    .map((id) => {
      const catalog = catalogById.get(id);
      const data = dataById.get(id);
      return catalog && data ? { catalog, data } : null;
    })
    .filter((e): e is { catalog: typeof activeCatalog[0]; data: typeof resolvedKpis[0] } => e != null);
  void processKpiAlerts(alertEntries);

  return (
    <BentoKpiDeck
      domainId={config.domainId}
      catalog={activeCatalog}
      resolvedKpis={resolvedKpis}
      prefs={prefs}
      onSavePrefs={saveDashboardPrefs}
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

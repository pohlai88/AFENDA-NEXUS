import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { fetchChartData, fetchDiagramData } from './dashboard-chart-data.server';
import { CHART_DIAGRAM_NONE } from './chart-registry';
import {
  CashFlowChart,
  RevenueExpenseChart,
  ARAgingChart,
  APAgingChart,
} from '@/features/finance/dashboard/blocks/dashboard-charts';
import type { DomainDashboardConfig } from './types';
import type { UserPreferences } from '@afenda/contracts';


// ─── Chart/Diagram ID → Component mapping ───────────────────────────────────

const CHART_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  'chart.cashflow': CashFlowChart as React.ComponentType<{ data: unknown }>,
  'chart.revenueExpense': RevenueExpenseChart as React.ComponentType<{ data: unknown }>,
};

const DIAGRAM_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  'diagram.arAging': ARAgingChart as React.ComponentType<{ data: unknown }>,
  'diagram.apAging': APAgingChart as React.ComponentType<{ data: unknown }>,
};

// ─── Dashboard Visuals Section (Server) ──────────────────────────────────────

/**
 * Renders 1 chart + 1 diagram from the registry.
 * Uses user prefs (selectedChartId, selectedDiagramId) when set.
 */
export async function DashboardVisualsSection({
  config,
}: {
  config: DomainDashboardConfig;
}) {
  const chartSlotIds = config.chartSlotIds ?? [];
  const diagramSlotIds = config.diagramSlotIds ?? [];

  if (chartSlotIds.length === 0 && diagramSlotIds.length === 0) {
    return null;
  }

  const ctx = await getRequestContext();

  // Load user prefs for chart/diagram selection
  let selectedChartId: string | null = chartSlotIds[0] ?? null;
  let selectedDiagramId: string | null = diagramSlotIds[0] ?? null;
  try {
    const api = createApiClient(ctx);
    const result = await api.get<UserPreferences>('/me/preferences');
    if (result.ok) {
      const prefs = result.value.dashboards?.[config.domainId] ?? {};
      if (prefs.selectedChartId === CHART_DIAGRAM_NONE) {
        selectedChartId = null;
      } else if (prefs.selectedChartId && chartSlotIds.includes(prefs.selectedChartId)) {
        selectedChartId = prefs.selectedChartId;
      }
      if (prefs.selectedDiagramId === CHART_DIAGRAM_NONE) {
        selectedDiagramId = null;
      } else if (prefs.selectedDiagramId && diagramSlotIds.includes(prefs.selectedDiagramId)) {
        selectedDiagramId = prefs.selectedDiagramId;
      }
    }
  } catch {
    // Use defaults
  }

  // Fetch chart data (server-side: API-first, stub fallback when endpoints missing)
  let chartData: unknown = null;
  if (selectedChartId && selectedChartId !== CHART_DIAGRAM_NONE) {
    chartData = await fetchChartData(selectedChartId, ctx);
  }

  // Fetch diagram data (server-side: API-first, stub fallback when endpoints missing)
  let diagramData: unknown = null;
  if (selectedDiagramId && selectedDiagramId !== CHART_DIAGRAM_NONE) {
    diagramData = await fetchDiagramData(selectedDiagramId, ctx);
  }

  const ChartComponent = selectedChartId ? CHART_COMPONENTS[selectedChartId] : null;
  const DiagramComponent = selectedDiagramId ? DIAGRAM_COMPONENTS[selectedDiagramId] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ChartComponent && chartData ? (
        <div className="min-h-[360px] lg:col-span-2">
          <ChartComponent data={chartData} />
        </div>
      ) : null}
      {DiagramComponent && diagramData ? (
        <div className="min-h-[360px]">
          <DiagramComponent data={diagramData} />
        </div>
      ) : null}
    </div>
  );
}

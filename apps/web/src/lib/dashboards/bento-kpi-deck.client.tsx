'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import GridLayout, { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';

// Responsive breakpoints: 4 cols (lg) → 2 cols (md) → 1 col (sm)
// Uses matchMedia: re-renders only on breakpoint change, not every pixel (rerender-subscribe-derived-state)
function useResponsiveCols(): number {
  const [cols, setCols] = React.useState(4);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaLg = window.matchMedia('(min-width: 1024px)');
    const mediaMd = window.matchMedia('(min-width: 640px)');
    const update = () => {
      setCols(mediaLg.matches ? 4 : mediaMd.matches ? 2 : 1);
    };
    update();
    mediaLg.addEventListener('change', update);
    mediaMd.addEventListener('change', update);
    return () => {
      mediaLg.removeEventListener('change', update);
      mediaMd.removeEventListener('change', update);
    };
  }, []);
  return cols;
}
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KPICard } from '@/components/erp/kpi-card';
import {
  CashFlowChart,
  RevenueExpenseChart,
  ARAgingChart,
  APAgingChart,
} from '@/features/finance/dashboard/blocks/dashboard-charts';
import { LiquidityWaterfallChart } from '@/features/finance/dashboard/blocks/liquidity-waterfall-chart';
import { FinancialRatiosChart } from '@/features/finance/dashboard/blocks/financial-ratios-chart';
import { DSOTrendChart } from '@/features/finance/dashboard/blocks/dso-trend-chart';
import { BudgetVarianceChart } from '@/features/finance/dashboard/blocks/budget-variance-chart';
import { AssetTreemapChart } from '@/features/finance/dashboard/blocks/asset-treemap-chart';
import type { KPICatalogEntry } from '@/lib/kpis/kpi-catalog';
import type { KPIResolverResult } from '@/lib/kpis/kpi-registry.server';
import type { DashboardPrefs, WidgetLayoutItem } from '@afenda/contracts';

/** Grid layout item with RGL constraints; persisted layout strips min/max. */
type GridLayoutItem = WidgetLayoutItem & {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

type ChartProps = { data: unknown; compact?: boolean; gridW?: number; gridH?: number };
const CHART_COMPONENTS: Record<string, React.ComponentType<ChartProps>> = {
  'chart.cashflow': CashFlowChart as React.ComponentType<ChartProps>,
  'chart.revenueExpense': RevenueExpenseChart as React.ComponentType<ChartProps>,
  'chart.liquidity-waterfall': LiquidityWaterfallChart as React.ComponentType<ChartProps>,
  'chart.financial-ratios': FinancialRatiosChart as React.ComponentType<ChartProps>,
  'chart.dso-trend': DSOTrendChart as React.ComponentType<ChartProps>,
  'chart.budget-variance': BudgetVarianceChart as React.ComponentType<ChartProps>,
  'chart.asset-portfolio': AssetTreemapChart as React.ComponentType<ChartProps>,
};

const DIAGRAM_COMPONENTS: Record<string, React.ComponentType<ChartProps>> = {
  'diagram.arAging': ARAgingChart as React.ComponentType<ChartProps>,
  'diagram.apAging': APAgingChart as React.ComponentType<ChartProps>,
};

const ResponsiveGridLayout = WidthProvider(GridLayout);

// ─── Bento KPI Deck (Client) ─────────────────────────────────────────────────
// Top panel of the domain dashboard. Renders KPICards in a bento-style
// drag-and-drop grid with pre-configured sizes (1x1, 2x1, 1x2, 2x2).
// Layout is persisted to user preferences.

const DEFAULT_COLS = 4;
/** Row height: charts/diagrams need space — per shadcn layout, avoid cramped visuals. */
const ROW_HEIGHT = 140;
const MARGIN: [number, number] = [12, 12];

/** Infer widget type from layout id (kpi id, chart id, or diagram id). */
function widgetType(i: string): 'kpi' | 'chart' | 'diagram' {
  if (i.startsWith('chart.') || i.startsWith('chart-')) return 'chart';
  if (i.startsWith('diagram.') || i.startsWith('diagram-')) return 'diagram';
  return 'kpi';
}

/** Min constraints only — KPI min 1×1, chart/diagram min 2×2 (capped by cols on narrow grids). Max unlocked so widgets can be enlarged. */
const TYPE_CONSTRAINTS = {
  kpi: { minW: 1, minH: 1 },
  chart: { minW: 2, minH: 2 },
  diagram: { minW: 2, minH: 2 },
} as const;

function getMinW(type: 'kpi' | 'chart' | 'diagram', cols: number): number {
  const base = TYPE_CONSTRAINTS[type];
  return type === 'chart' || type === 'diagram' ? Math.min(base.minW, cols) : base.minW;
}
function getMinH(type: 'kpi' | 'chart' | 'diagram'): number {
  return TYPE_CONSTRAINTS[type].minH;
}

function computeLayout(
  widgetIds: string[],
  saved?: WidgetLayoutItem[],
  selectedChartId?: string | null,
  selectedDiagramId?: string | null,
  cols: number = DEFAULT_COLS
): GridLayoutItem[] {
  const result: GridLayoutItem[] = [];

  // Use saved order for items. Flow from (0,0).
  // Deduplicate savedOrder to prevent duplicate React keys from stale prefs.
  const savedOrder = [...new Set((saved ?? []).map((l) => l.i))];
  const allIds = new Set([
    ...widgetIds,
    ...(selectedChartId ? [selectedChartId] : []),
    ...(selectedDiagramId ? [selectedDiagramId] : []),
  ]);
  const ordered = [...savedOrder.filter((id) => allIds.has(id))];
  for (const id of allIds) {
    if (!ordered.includes(id)) ordered.push(id);
  }

  let x = 0;
  let rowStartY = 0;
  let rowMaxY = 0;

  // Charts/diagrams: 2×2 default on lg; 1×2 on md; 1×1 on sm. Min enforced, max unlocked.
  for (const id of ordered) {
    const type = widgetType(id);
    const chartW = cols >= 4 ? 2 : cols >= 2 ? 2 : 1;
    const chartH = cols >= 4 ? 2 : cols >= 2 ? 2 : 1;
    const minW = getMinW(type, cols);
    const minH = getMinH(type);
    const w = type === 'chart' || type === 'diagram' ? Math.max(minW, chartW) : 1;
    const h = type === 'chart' || type === 'diagram' ? Math.max(minH, chartH) : 1;

    result.push({
      i: id,
      x,
      y: rowStartY,
      w,
      h,
      minW,
      minH,
    });

    rowMaxY = Math.max(rowMaxY, rowStartY + h);
    x += w;
    if (x >= cols) {
      x = 0;
      rowStartY = rowMaxY;
      rowMaxY = rowStartY;
    }
  }

  return result;
}

/** Validation result: sanitized layout to use, or undefined to fall back to computeLayout. */
export interface ValidatedLayoutResult {
  layout: WidgetLayoutItem[] | undefined;
  isValid: boolean;
}

/**
 * Validate persisted widget layout on prefs load.
 * - Remove items whose widgetId no longer exists
 * - Clamp x within [0, cols - w], w within [1, cols], y >= 0
 * - If collisions detected, return undefined (fallback to computeLayout)
 */
function validateWidgetLayout(params: {
  layout: WidgetLayoutItem[] | undefined;
  widgetIds: Set<string>;
  cols: number;
}): ValidatedLayoutResult {
  const { layout, widgetIds, cols } = params;
  if (!layout?.length) return { layout: undefined, isValid: true };

  const filtered = layout.filter((item) => widgetIds.has(item.i));
  if (filtered.length === 0) return { layout: undefined, isValid: true };

  const clamped: WidgetLayoutItem[] = [];
  for (const item of filtered) {
    const w = Math.max(1, Math.min(Math.round(item.w) || 1, cols));
    const h = Math.max(1, Math.round(item.h) || 1);
    const x = Math.max(0, Math.min(Math.round(item.x) ?? 0, cols - w));
    const y = Math.max(0, Math.round(item.y) ?? 0);
    clamped.push({ i: item.i, x, y, w, h });
  }

  // Detect collisions
  const cells = new Set<string>();
  for (const item of clamped) {
    for (let dy = 0; dy < item.h; dy++) {
      for (let dx = 0; dx < item.w; dx++) {
        const key = `${item.x + dx},${item.y + dy}`;
        if (cells.has(key)) return { layout: undefined, isValid: false };
        cells.add(key);
      }
    }
  }
  return { layout: clamped, isValid: true };
}

/**
 * Merge validated layout with min constraints for react-grid-layout.
 * Max omitted so widgets can be enlarged; persisted layout strips min/max.
 */
function mergeLayoutWithConstraints(
  validated: WidgetLayoutItem[],
  widgetIds: Set<string>,
  cols: number
): GridLayoutItem[] {
  return validated.map((item) => {
    const type = widgetType(item.i);
    const minW = getMinW(type, cols);
    const minH = getMinH(type);
    return {
      ...item,
      w: Math.max(minW, Math.round(item.w) || 1),
      h: Math.max(minH, Math.round(item.h) || 1),
      x: Math.round(item.x) ?? 0,
      y: Math.round(item.y) ?? 0,
      minW,
      minH,
    };
  });
}

/** Find first empty 1×1 slot that doesn't overlap with items (excluding excludeId). */
function _findEmptySlot(
  items: WidgetLayoutItem[],
  excludeId: string,
  cols: number,
  reserve?: { x: number; y: number; w: number; h: number }
): { x: number; y: number } {
  const occupied = items
    .filter((l) => l.i !== excludeId)
    .flatMap((l) => {
      const w = Math.round((l.w as number) || 1) || 1;
      const h = Math.round((l.h as number) || 1) || 1;
      const cells: [number, number][] = [];
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++) cells.push([(l.x as number) + dx, (l.y as number) + dy]);
      return cells;
    });
  const reserved = reserve
    ? (() => {
        const out: [number, number][] = [];
        for (let dy = 0; dy < reserve.h; dy++)
          for (let dx = 0; dx < reserve.w; dx++) out.push([reserve.x + dx, reserve.y + dy]);
        return out;
      })()
    : [];
  const blocked = new Set([...occupied, ...reserved].map(([a, b]) => `${a},${b}`));
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < cols; x++) {
      if (!blocked.has(`${x},${y}`)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/** Chart/diagram slot for unified bento grid (data only; component resolved by id). */
export interface BentoChartSlot {
  id: string;
  data: unknown;
}

interface BentoKpiDeckProps {
  domainId: string;
  catalog: KPICatalogEntry[];
  resolvedKpis: KPIResolverResult[];
  prefs: DashboardPrefs;
  onSavePrefs: (
    domainId: string,
    prefs: DashboardPrefs
  ) => Promise<{ ok?: boolean; error?: string } | void>;
  configDialog?: React.ReactNode;
  /** Chart slots to render in the same grid. */
  chartSlots?: BentoChartSlot[];
  /** Diagram slots to render in the same grid. */
  diagramSlots?: BentoChartSlot[];
}

function BentoKpiDeck({
  domainId,
  catalog,
  resolvedKpis,
  prefs,
  onSavePrefs,
  configDialog,
  chartSlots = [],
  diagramSlots = [],
}: BentoKpiDeckProps) {
  const [isOpen, setIsOpen] = React.useState(!prefs.topCollapsed);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const cols = useResponsiveCols();

  // Use prefs when set; fall back to chartSlots/diagramSlots when prefs are empty
  // (e.g. API failed or user never configured) so charts/diagrams show when we have data
  const selectedChartId =
    prefs.selectedChartId === '__none__'
      ? null
      : ((prefs.selectedChartId || chartSlots[0]?.id) ?? null);
  const selectedDiagramId =
    prefs.selectedDiagramId === '__none__'
      ? null
      : ((prefs.selectedDiagramId || diagramSlots[0]?.id) ?? null);

  const computedLayout = React.useMemo(() => {
    const kpiIds = [...new Set(resolvedKpis.map((d) => d.id))];
    const allWidgetIds = new Set([
      ...kpiIds,
      ...(selectedChartId ? [selectedChartId] : []),
      ...(selectedDiagramId ? [selectedDiagramId] : []),
    ]);
    const { layout: validatedLayout } = validateWidgetLayout({
      layout: prefs.widgetLayout,
      widgetIds: allWidgetIds,
      cols,
    });
    // Use saved layout when valid and complete — preserves drag/resize
    const validatedIds = new Set(validatedLayout?.map((l) => l.i) ?? []);
    const allIdsPresent = [...allWidgetIds].every((id) => validatedIds.has(id));
    if (validatedLayout?.length && allIdsPresent) {
      return mergeLayoutWithConstraints(validatedLayout, allWidgetIds, cols);
    }
    return computeLayout(
      kpiIds,
      validatedLayout ?? undefined,
      selectedChartId,
      selectedDiagramId,
      cols
    );
  }, [resolvedKpis, prefs.widgetLayout, selectedChartId, selectedDiagramId, cols]);

  // Optimistic layout: update immediately on drag/resize, sync from server when widget set or preset changes
  const [localLayout, setLocalLayout] = React.useState(computedLayout);
  React.useEffect(() => {
    setLocalLayout(computedLayout);
  }, [computedLayout]);

  const layout = localLayout;

  const prefsRef = React.useRef(prefs);
  prefsRef.current = prefs;

  const handleToggle = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      startTransition(() => {
        void onSavePrefs(domainId, { ...prefsRef.current, topCollapsed: !open });
      });
    },
    [domainId, onSavePrefs]
  );

  const handleLayoutChange = React.useCallback(
    (newLayout: WidgetLayoutItem[]) => {
      const p = prefsRef.current;
      const normalized = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: Math.round(item.w) || 1,
        h: Math.round(item.h) || 1,
      }));
      // Hero is opt-in only: dragging/reordering never changes hero status.
      setLocalLayout(newLayout);
      startTransition(() => {
        void onSavePrefs(domainId, {
          ...p,
          widgetLayout: normalized,
        });
      });
    },
    [domainId, onSavePrefs]
  );

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const dataById = new Map(resolvedKpis.map((d) => [d.id, d]));
  const chartById = new Map(chartSlots.map((s) => [s.id, s]));
  const diagramById = new Map(diagramSlots.map((s) => [s.id, s]));

  // Filter layout to only include valid items with data (prevents key warnings for missing items)
  const validLayout = layout.filter((item) => {
    const type = widgetType(item.i);
    if (type === 'chart') {
      const slot = chartById.get(item.i);
      return slot?.data && CHART_COMPONENTS[item.i];
    }
    if (type === 'diagram') {
      const slot = diagramById.get(item.i);
      return slot?.data && DIAGRAM_COMPONENTS[item.i];
    }
    return catalogById.has(item.i) && dataById.has(item.i);
  });

  const hasContent = validLayout.length > 0;
  if (!hasContent) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle} data-testid="bento-kpi-deck">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-sm font-medium text-muted-foreground">Key Metrics</span>
            </Button>
          </CollapsibleTrigger>
          {!isOpen && (
            <span className="text-xs text-muted-foreground">
              {validLayout.length} widget{validLayout.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {configDialog}
      </div>

      <CollapsibleContent className="mt-3 w-full min-w-0 overflow-hidden">
        <div className="relative w-full min-w-0 overflow-hidden">
          <ResponsiveGridLayout
            layout={validLayout}
            onLayoutChange={(l) => handleLayoutChange([...l])}
            cols={cols}
            rowHeight={ROW_HEIGHT}
            margin={MARGIN}
            draggableHandle=".react-grid-drag-handle"
            compactType="vertical"
            preventCollision={false}
            isBounded
            isResizable
            resizeHandles={['se', 's', 'e']}
            className="bento-kpi-grid w-full min-w-0 overflow-hidden [&_.react-grid-placeholder]:bg-primary/10! [&_.react-grid-placeholder]:rounded-lg!"
            data-testid="bento-grid-layout"
          >
            {validLayout.map((item) => {
              const type = widgetType(item.i);

              if (type === 'chart') {
                const slot = chartById.get(item.i);
                const ChartC = CHART_COMPONENTS[item.i];
                if (!slot || !ChartC) return <div key={item.i} />;
                return (
                  <div
                    key={item.i}
                    className="group relative flex h-full min-h-0 min-w-0 overflow-hidden"
                  >
                    <div
                      className="react-grid-drag-handle absolute left-2 top-2 right-auto z-10 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {/* pl-8: drag handle left(8px)+width(24px)=32px — avoids overlap with card title */}
                    <div className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden p-3 pl-8">
                      <ChartC data={slot.data} compact gridW={item.w ?? 2} gridH={item.h ?? 2} />
                    </div>
                  </div>
                );
              }

              if (type === 'diagram') {
                const slot = diagramById.get(item.i);
                const DiagramC = DIAGRAM_COMPONENTS[item.i];
                if (!slot || !DiagramC) return <div key={item.i} />;
                return (
                  <div
                    key={item.i}
                    className="group relative flex h-full min-h-0 min-w-0 overflow-hidden"
                  >
                    <div
                      className="react-grid-drag-handle absolute left-2 top-2 right-auto z-10 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {/* pl-8: drag handle left(8px)+width(24px)=32px — avoids overlap with card title */}
                    <div className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden p-3 pl-8">
                      <DiagramC data={slot.data} compact gridW={item.w ?? 2} gridH={item.h ?? 2} />
                    </div>
                  </div>
                );
              }

              const catalogEntry = catalogById.get(item.i);
              const data = dataById.get(item.i);
              if (!catalogEntry || !data) return <div key={item.i} />;
              return (
                <div key={item.i} className="group relative flex h-full min-h-0">
                  <div
                    className="react-grid-drag-handle absolute left-2 top-2 right-auto z-10 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {/* pl-8 (32px): drag handle left(8px) + width(24px) = 32px — prevents title overlap */}
                  <div className="h-full w-full overflow-hidden rounded-lg pl-8 transition-all duration-200">
                    <KPICard
                      catalog={catalogEntry}
                      data={data}
                      plainLanguage={prefs.plainLanguage}
                      variant="compact"
                      gridW={1}
                      gridH={1}
                      onRefresh={() => router.refresh()}
                    />
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
BentoKpiDeck.displayName = 'BentoKpiDeck';

export {
  BentoKpiDeck,
  validateWidgetLayout,
  computeLayout,
  mergeLayoutWithConstraints,
  widgetType,
};
export type { BentoKpiDeckProps };

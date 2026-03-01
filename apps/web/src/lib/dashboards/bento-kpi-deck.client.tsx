'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import GridLayout, { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';

// Responsive breakpoints: 4 cols (lg) → 2 cols (md) → 1 col (sm)
function useResponsiveCols(): number {
  const [cols, setCols] = React.useState(4);
  React.useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      setCols(w >= 1024 ? 4 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { KPICard } from '@/components/erp/kpi-card';
import type { KPICatalogEntry } from '@/lib/kpis/kpi-catalog';
import type { KPIResolverResult } from '@/lib/kpis/kpi-registry.server';
import type { DashboardPrefs, WidgetLayoutItem } from '@afenda/contracts';

const ResponsiveGridLayout = WidthProvider(GridLayout);

// ─── Bento KPI Deck (Client) ─────────────────────────────────────────────────
// Top panel of the domain dashboard. Renders KPICards in a bento-style
// drag-and-drop grid with pre-configured sizes (1x1, 2x1, 1x2, 2x2).
// Layout is persisted to user preferences.

const DEFAULT_COLS = 4;
const ROW_HEIGHT = 130;
const MARGIN: [number, number] = [16, 16];

function computeLayout(
  widgetIds: string[],
  saved?: WidgetLayoutItem[],
): WidgetLayoutItem[] {
  const savedById = new Map(saved?.map((l) => [l.i, l]) ?? []);
  const result: WidgetLayoutItem[] = [];
  const added = new Set<string>();

  // Preserve saved layout for existing widgets (with min/max for resize)
  for (const item of saved ?? []) {
    if (widgetIds.includes(item.i)) {
      result.push({
        ...item,
        i: item.i,
        minW: 1,
        minH: 1,
        maxW: 2,
        maxH: 2,
      });
      added.add(item.i);
    }
  }

  // Append new widgets at the end
  const maxY =
    result.length > 0
      ? Math.max(...result.map((l) => l.y + l.h), 0)
      : 0;
  let x = 0;
  let y = maxY;

  // Hero metric: first new card is 2x1 when no saved layout
  const isFirstNew = result.length === 0 && widgetIds.length > 0;
  for (let i = 0; i < widgetIds.length; i++) {
    const id = widgetIds[i]!;
    if (added.has(id)) continue;
    const isHero = isFirstNew && i === 0;
    result.push({
      i: id,
      x,
      y,
      w: isHero ? 2 : 1,
      h: 1,
      minW: 1,
      minH: 1,
      maxW: 2,
      maxH: 2,
    });
    x += isHero ? 2 : 1;
    if (x >= DEFAULT_COLS) {
      x = 0;
      y++;
    }
  }

  return result;
}

interface BentoKpiDeckProps {
  domainId: string;
  catalog: KPICatalogEntry[];
  resolvedKpis: KPIResolverResult[];
  prefs: DashboardPrefs;
  onSavePrefs: (domainId: string, prefs: DashboardPrefs) => Promise<void>;
  configDialog?: React.ReactNode;
}

function BentoKpiDeck({
  domainId,
  catalog,
  resolvedKpis,
  prefs,
  onSavePrefs,
  configDialog,
}: BentoKpiDeckProps) {
  const [isOpen, setIsOpen] = React.useState(!prefs.topCollapsed);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const cols = useResponsiveCols();

  const computedLayout = React.useMemo(
    () => computeLayout(resolvedKpis.map((d) => d.id), prefs.widgetLayout),
    [resolvedKpis, prefs.widgetLayout],
  );

  // Optimistic layout: update immediately on drag/resize, sync from server when widget set or preset changes
  const [localLayout, setLocalLayout] = React.useState(computedLayout);
  React.useEffect(() => {
    setLocalLayout(computedLayout);
  }, [computedLayout]);

  const layout = localLayout;

  const handleToggle = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      startTransition(() => {
        void onSavePrefs(domainId, { ...prefs, topCollapsed: !open });
      });
    },
    [domainId, prefs, onSavePrefs],
  );

  const handleLayoutChange = React.useCallback(
    (newLayout: WidgetLayoutItem[]) => {
      // Normalize to schema: only i, x, y, w, h (react-grid-layout may add moved, static, etc.)
      const normalized = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: Math.round(item.w) || 1,
        h: Math.round(item.h) || 1,
      }));
      setLocalLayout(normalized);
      startTransition(() => {
        void onSavePrefs(domainId, { ...prefs, widgetLayout: normalized });
      });
    },
    [domainId, prefs, onSavePrefs],
  );

  if (catalog.length === 0) {
    return null;
  }

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const dataById = new Map(resolvedKpis.map((d) => [d.id, d]));

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                Key Metrics
              </span>
            </Button>
          </CollapsibleTrigger>
          {!isOpen && (
            <span className="text-xs text-muted-foreground">
              {catalog.length} widget{catalog.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {configDialog}
      </div>

      <CollapsibleContent className="mt-3 w-full min-w-0">
        <div className="w-full min-w-0">
          <ResponsiveGridLayout
          layout={layout}
          onLayoutChange={handleLayoutChange}
          cols={cols}
          rowHeight={ROW_HEIGHT}
          margin={MARGIN}
          draggableHandle=".react-grid-drag-handle"
          compactType="vertical"
          preventCollision={false}
          isBounded
          isResizable
          resizeHandles={['se', 's', 'e']}
          className="bento-kpi-grid [&_.react-grid-placeholder]:bg-primary/10! [&_.react-grid-placeholder]:rounded-lg!"
        >
              {layout.map((item) => {
                const catalogEntry = catalogById.get(item.i);
                const data = dataById.get(item.i);
                if (!catalogEntry || !data) return null;
                return (
                  <div
                    key={item.i}
                    className="group relative flex h-full min-h-0"
                  >
                    <div
                      className="react-grid-drag-handle absolute right-2 top-2 z-10 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-full w-full overflow-hidden">
                      <KPICard
                        catalog={catalogEntry}
                        data={data}
                        plainLanguage={prefs.plainLanguage}
                        gridW={Math.max(1, item.w ?? 1)}
                        gridH={Math.max(1, item.h ?? 1)}
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

export { BentoKpiDeck };
export type { BentoKpiDeckProps };

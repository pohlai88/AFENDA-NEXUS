'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2, Search, RotateCcw } from 'lucide-react';
import type { KPICatalogEntry } from '@/lib/kpis/kpi-catalog';
import { toPlainTitle } from '@/lib/kpis/kpi-plain-title';
import { cn } from '@/lib/utils';
import { SCROLL_MAX_H } from '@/components/afenda/shell.tokens';
import type { DashboardPrefs } from '@afenda/contracts';
import { CHART_META, DIAGRAM_META, CHART_DIAGRAM_NONE } from './chart-registry';
import { toSorted } from '@/lib/utils/array';

const NONE_VALUE = CHART_DIAGRAM_NONE;

interface WidgetConfigDialogProps {
  domainId: string;
  availableCatalog: KPICatalogEntry[];
  activeKpiIds: string[];
  defaultKpiIds: string[];
  maxWidgets?: number;
  chartSlotIds?: string[];
  diagramSlotIds?: string[];
  prefs: DashboardPrefs;
  onSavePrefs: (
    domainId: string,
    prefs: DashboardPrefs
  ) => Promise<{ ok?: boolean; error?: string } | void>;
}

function WidgetConfigDialog({
  domainId,
  availableCatalog,
  activeKpiIds,
  defaultKpiIds,
  maxWidgets,
  chartSlotIds = [],
  diagramSlotIds = [],
  prefs,
  onSavePrefs,
}: WidgetConfigDialogProps) {
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(activeKpiIds));
  const [selectedChart, setSelectedChart] = React.useState<string>(
    () => prefs.selectedChartId ?? chartSlotIds[0] ?? NONE_VALUE
  );
  const [selectedDiagram, setSelectedDiagram] = React.useState<string>(
    () => prefs.selectedDiagramId ?? diagramSlotIds[0] ?? NONE_VALUE
  );
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setSelected(new Set(activeKpiIds));
      setSelectedChart(prefs.selectedChartId ?? chartSlotIds[0] ?? NONE_VALUE);
      setSelectedDiagram(prefs.selectedDiagramId ?? diagramSlotIds[0] ?? NONE_VALUE);
      setSearchQuery('');
    }
  }, [
    open,
    activeKpiIds,
    prefs.selectedChartId,
    prefs.selectedDiagramId,
    chartSlotIds,
    diagramSlotIds,
  ]);

  const filteredCatalog = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableCatalog;
    return availableCatalog.filter((entry) => {
      const plain = entry.plainTitle ?? toPlainTitle(entry.title, entry.description);
      const titleMatch = entry.title.toLowerCase().includes(q) || plain.toLowerCase().includes(q);
      const keywordMatch = entry.searchKeywords?.some((kw) => kw.toLowerCase().includes(q));
      return titleMatch || keywordMatch;
    });
  }, [availableCatalog, searchQuery]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (maxWidgets && next.size >= maxWidgets) return prev;
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const saveToPrefs = React.useCallback(
    async (prefsToSave: DashboardPrefs) => {
      const result = await onSavePrefs(domainId, prefsToSave);
      if (result && 'ok' in result && !result.ok) {
        const { toast } = await import('sonner');
        toast.error(result.error ?? 'Failed to save preferences');
        return;
      }
      // Use reload instead of router.refresh() to avoid "unexpected response" RSC fetch race
      window.location.reload();
    },
    [domainId, onSavePrefs]
  );

  const handleApply = async () => {
    setSaving(true);
    try {
      const ordered = availableCatalog.map((c) => c.id).filter((id) => selected.has(id));
      const finalOrdered = maxWidgets ? ordered.slice(0, maxWidgets) : ordered;

      await saveToPrefs({
        ...prefs,
        selectedWidgetIds: finalOrdered,
        widgetOrder: finalOrdered,
        selectedChartId:
          hasCharts && selectedChart !== NONE_VALUE
            ? selectedChart
            : hasCharts
              ? NONE_VALUE
              : undefined,
        selectedDiagramId:
          hasDiagrams && selectedDiagram !== NONE_VALUE
            ? selectedDiagram
            : hasDiagrams
              ? NONE_VALUE
              : undefined,
        savedViewId: 'custom',
        widgetLayout: undefined,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelected(new Set(defaultKpiIds));
    setSelectedChart(chartSlotIds[0] ?? NONE_VALUE);
    setSelectedDiagram(diagramSlotIds[0] ?? NONE_VALUE);
  };

  const handleResetAndApply = async () => {
    handleReset();
    setSaving(true);
    try {
      const ordered = defaultKpiIds.slice(0, maxWidgets ?? defaultKpiIds.length);
      await saveToPrefs({
        ...prefs,
        selectedWidgetIds: ordered,
        widgetOrder: ordered,
        selectedChartId: hasCharts ? (chartSlotIds[0] ?? NONE_VALUE) : undefined,
        selectedDiagramId: hasDiagrams ? (diagramSlotIds[0] ?? NONE_VALUE) : undefined,
        savedViewId: 'custom',
        widgetLayout: undefined,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const hasCharts = chartSlotIds.length > 0;
  const hasDiagrams = diagramSlotIds.length > 0;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearchQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 p-0">
        {/* ─── Fixed header: title + search (never scrolls) ─── */}
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle className="text-base">Dashboard Layout</PopoverTitle>
          <p className="text-xs text-muted-foreground">
            {maxWidgets
              ? `Up to ${maxWidgets} KPI cards, one chart, one diagram.`
              : 'Configure cards, chart, and diagram.'}
          </p>
          <div className="mt-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="kpi-search"
                placeholder="Search KPIs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
                aria-label="Filter KPIs"
              />
            </div>
          </div>
        </PopoverHeader>

        {/* ─── Scrollable content: segmented groups (like ModuleNavPopover) ─── */}
        <ScrollArea className={cn(SCROLL_MAX_H, 'h-[min(70vh,24rem)]')} type="auto">
          <nav className="flex flex-col gap-1 py-3 pr-4 pl-3" aria-label="Dashboard configuration">
            {/* ── KPI Cards group ── */}
            <div className="px-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <span>KPI Cards</span>
                <span className="ml-auto tabular-nums">
                  {selected.size}
                  {maxWidgets ? `/${maxWidgets}` : ''}
                </span>
              </div>
              <ul className="space-y-0.5">
                {toSorted(filteredCatalog, (a, b) => {
                  const pa = a.displayPriority ?? 999;
                  const pb = b.displayPriority ?? 999;
                  return pa - pb || a.title.localeCompare(b.title);
                }).map((entry) => (
                  <li key={entry.id}>
                    <label
                      className={cn(
                        'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                        selected.has(entry.id) && 'bg-accent font-medium text-accent-foreground'
                      )}
                    >
                      <Checkbox
                        checked={selected.has(entry.id)}
                        onCheckedChange={(checked) => handleToggle(entry.id, checked === true)}
                        className="shrink-0"
                      />
                      <span className="truncate">{entry.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {hasCharts && (
              <>
                <Separator className="my-1" />
                <div className="px-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <span>Chart</span>
                  </div>
                  <RadioGroup value={selectedChart} onValueChange={setSelectedChart}>
                    <ul className="space-y-0.5">
                      <li>
                        <label
                          className={cn(
                            'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                            selectedChart === NONE_VALUE &&
                              'bg-accent font-medium text-accent-foreground'
                          )}
                        >
                          <RadioGroupItem value={NONE_VALUE} id="chart-none" className="shrink-0" />
                          <span>None</span>
                        </label>
                      </li>
                      {chartSlotIds.map((id) => {
                        const meta = CHART_META[id];
                        return (
                          <li key={id}>
                            <label
                              className={cn(
                                'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                selectedChart === id &&
                                  'bg-accent font-medium text-accent-foreground'
                              )}
                            >
                              <RadioGroupItem value={id} id={`chart-${id}`} className="shrink-0" />
                              <span className="truncate">{meta?.title ?? id}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </RadioGroup>
                </div>
              </>
            )}

            {hasDiagrams && (
              <>
                <Separator className="my-1" />
                <div className="px-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <span>Diagram</span>
                  </div>
                  <RadioGroup value={selectedDiagram} onValueChange={setSelectedDiagram}>
                    <ul className="space-y-0.5">
                      <li>
                        <label
                          className={cn(
                            'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                            selectedDiagram === NONE_VALUE &&
                              'bg-accent font-medium text-accent-foreground'
                          )}
                        >
                          <RadioGroupItem
                            value={NONE_VALUE}
                            id="diagram-none"
                            className="shrink-0"
                          />
                          <span>None</span>
                        </label>
                      </li>
                      {diagramSlotIds.map((id) => {
                        const meta = DIAGRAM_META[id];
                        return (
                          <li key={id}>
                            <label
                              className={cn(
                                'flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                selectedDiagram === id &&
                                  'bg-accent font-medium text-accent-foreground'
                              )}
                            >
                              <RadioGroupItem
                                value={id}
                                id={`diagram-${id}`}
                                className="shrink-0"
                              />
                              <span className="truncate">{meta?.title ?? id}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </RadioGroup>
                </div>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* ─── Fixed footer (never scrolls) ─── */}
        <Separator />
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAndApply}
            disabled={saving}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset
          </Button>
          <Button size="sm" onClick={handleApply} disabled={saving || selected.size === 0}>
            {saving ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
WidgetConfigDialog.displayName = 'WidgetConfigDialog';

export { WidgetConfigDialog };
export type { WidgetConfigDialogProps };

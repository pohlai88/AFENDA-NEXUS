'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings2, Search } from 'lucide-react';
import type { KPICatalogEntry } from '@/lib/kpis/kpi-catalog';
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
  onSavePrefs: (domainId: string, prefs: DashboardPrefs) => Promise<{ ok?: boolean; error?: string } | void>;
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
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(activeKpiIds),
  );
  const [selectedChart, setSelectedChart] = React.useState<string>(
    () => prefs.selectedChartId ?? chartSlotIds[0] ?? NONE_VALUE,
  );
  const [selectedDiagram, setSelectedDiagram] = React.useState<string>(
    () => prefs.selectedDiagramId ?? diagramSlotIds[0] ?? NONE_VALUE,
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
  }, [open, activeKpiIds, prefs.selectedChartId, prefs.selectedDiagramId, chartSlotIds, diagramSlotIds]);

  const filteredCatalog = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableCatalog;
    return availableCatalog.filter((entry) => {
      const titleMatch = entry.title.toLowerCase().includes(q) ||
        (entry.plainTitle?.toLowerCase().includes(q));
      const keywordMatch = entry.searchKeywords?.some((kw) =>
        kw.toLowerCase().includes(q),
      );
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
    [domainId, onSavePrefs],
  );

  const handleApply = async () => {
    setSaving(true);
    try {
      const ordered = availableCatalog
        .map((c) => c.id)
        .filter((id) => selected.has(id));
      const finalOrdered = maxWidgets ? ordered.slice(0, maxWidgets) : ordered;

      await saveToPrefs({
        ...prefs,
        selectedWidgetIds: finalOrdered,
        widgetOrder: finalOrdered,
        selectedChartId:
          hasCharts && selectedChart !== NONE_VALUE ? selectedChart : (hasCharts ? NONE_VALUE : undefined),
        selectedDiagramId:
          hasDiagrams && selectedDiagram !== NONE_VALUE ? selectedDiagram : (hasDiagrams ? NONE_VALUE : undefined),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dashboard Layout</DialogTitle>
          <DialogDescription>
            {maxWidgets
              ? `Choose up to ${maxWidgets} KPI cards, one chart, and one diagram.`
              : 'Configure cards, chart, and diagram.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="kpi-search">KPI Cards</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="kpi-search"
                placeholder="Search KPIs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-4">
              {toSorted(filteredCatalog, (a, b) => {
                  const pa = a.displayPriority ?? 999;
                  const pb = b.displayPriority ?? 999;
                  return pa - pb || a.title.localeCompare(b.title);
                })
                .map((entry) => (
                  <label
                    key={entry.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={selected.has(entry.id)}
                      onCheckedChange={(checked) =>
                        handleToggle(entry.id, checked === true)
                      }
                    />
                    <span className="text-sm">{entry.title}</span>
                  </label>
                ))}
            </div>
          </div>

          {hasCharts && (
            <div className="grid gap-2">
              <Label>Chart</Label>
              <RadioGroup
                value={selectedChart}
                onValueChange={setSelectedChart}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={NONE_VALUE} id="chart-none" />
                  <Label htmlFor="chart-none" className="font-normal cursor-pointer">
                    None
                  </Label>
                </div>
                {chartSlotIds.map((id) => {
                  const meta = CHART_META[id];
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <RadioGroupItem value={id} id={`chart-${id}`} />
                      <Label htmlFor={`chart-${id}`} className="font-normal cursor-pointer">
                        {meta?.title ?? id}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {hasDiagrams && (
            <div className="grid gap-2">
              <Label>Diagram</Label>
              <RadioGroup
                value={selectedDiagram}
                onValueChange={setSelectedDiagram}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={NONE_VALUE} id="diagram-none" />
                  <Label htmlFor="diagram-none" className="font-normal cursor-pointer">
                    None
                  </Label>
                </div>
                {diagramSlotIds.map((id) => {
                  const meta = DIAGRAM_META[id];
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <RadioGroupItem value={id} id={`diagram-${id}`} />
                      <Label htmlFor={`diagram-${id}`} className="font-normal cursor-pointer">
                        {meta?.title ?? id}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <Button variant="secondary" onClick={handleResetAndApply} disabled={saving}>
            Reset & Apply
          </Button>
          <Button onClick={handleApply} disabled={saving || selected.size === 0}>
            {saving ? 'Saving…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
WidgetConfigDialog.displayName = 'WidgetConfigDialog';

export { WidgetConfigDialog };
export type { WidgetConfigDialogProps };

'use client';

import * as React from 'react';
import { Filter, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { DashboardPrefs } from '@afenda/contracts';
import type { TimeRange } from '@afenda/contracts';
import type { SavedViewPreset } from './types';
import { cn } from '@/lib/utils';
import { ACTION_GAP, ICON, POPOVER_DOMAIN_W } from '@/components/afenda/shell.tokens';

// ─── Dashboard Header Bar (Client) ──────────────────────────────────────────
// Time range (MTD/QTD/YTD) + saved view + comparison + plain language.
// Aligned with ModuleNavPopover / ShortcutPopover framework.

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
  custom: 'Custom',
};

/** Returns active date range label (e.g. "Mar 1–31, 2025") for MTD/QTD/YTD. */
function getTimeRangeDateLabel(range: TimeRange): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let start: Date;
  let end: Date;
  switch (range) {
    case 'mtd':
      start = new Date(y, m, 1);
      end = new Date();
      break;
    case 'qtd':
      const q = Math.floor(m / 3) + 1;
      start = new Date(y, (q - 1) * 3, 1);
      end = new Date();
      break;
    case 'ytd':
      start = new Date(y, 0, 1);
      end = new Date();
      break;
    default:
      return '';
  }
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

type ComparisonMode = 'none' | 'vs_prior_period' | 'vs_budget' | 'vs_plan';
const COMPARISON_LABELS: Record<ComparisonMode, string> = {
  none: 'No comparison',
  vs_prior_period: 'vs prior period',
  vs_budget: 'vs budget',
  vs_plan: 'vs plan',
};

interface DashboardHeaderBarProps {
  domainId: string;
  savedViewPresets?: SavedViewPreset[];
  prefs: DashboardPrefs;
  onSavePrefs: (domainId: string, prefs: DashboardPrefs) => Promise<{ ok: boolean; error?: string }>;
}

function DashboardHeaderBar({
  domainId,
  savedViewPresets,
  prefs,
  onSavePrefs,
}: DashboardHeaderBarProps) {
  const timeRange = (prefs.timeRange ?? 'mtd') as TimeRange;
  const plainLanguage = prefs.plainLanguage ?? false;
  const comparisonMode = (prefs.comparisonMode ?? 'none') as ComparisonMode;
  const presets = React.useMemo(() => savedViewPresets ?? [], [savedViewPresets]);
  const savedViewId =
    prefs.savedViewId ??
    (prefs.selectedWidgetIds?.length ? 'custom' : presets[0]?.id ?? 'custom');

  const prefsRef = React.useRef(prefs);
  prefsRef.current = prefs;
  const [isSaving, setIsSaving] = React.useState(false);

  const savePrefs = React.useCallback(
    async (nextPrefs: DashboardPrefs) => {
      setIsSaving(true);
      try {
        const result = await onSavePrefs(domainId, nextPrefs);
        if (!result.ok) {
          toast.error(result.error ?? 'Failed to save preferences');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [domainId, onSavePrefs],
  );

  const handleTimeRangeChange = React.useCallback(
    (value: string) => {
      void savePrefs({
        ...prefsRef.current,
        timeRange: value as TimeRange,
      });
    },
    [savePrefs],
  );

  const handlePlainLanguageChange = React.useCallback(
    (checked: boolean) => {
      void savePrefs({
        ...prefsRef.current,
        plainLanguage: checked,
      });
    },
    [savePrefs],
  );

  const handleComparisonModeChange = React.useCallback(
    (value: string) => {
      void savePrefs({
        ...prefsRef.current,
        comparisonMode: value === 'none' ? undefined : (value as ComparisonMode),
      });
    },
    [savePrefs],
  );

  const handleSavedViewChange = React.useCallback(
    (value: string) => {
      const preset = presets.find((p) => p.id === value);
      if (preset) {
        void savePrefs({
          ...prefsRef.current,
          savedViewId: preset.id,
          selectedWidgetIds: preset.widgetIds,
          selectedChartId: preset.chartId,
          selectedDiagramId: preset.diagramId,
          widgetLayout: undefined,
        });
      } else {
        void savePrefs({
          ...prefsRef.current,
          savedViewId: 'custom',
        });
      }
    },
    [savePrefs, presets],
  );

  const isComparing = comparisonMode !== 'none';

  const controlsContent = (
    <div className={cn('flex flex-wrap items-center', ACTION_GAP)}>
      {presets.length > 0 && (
        <div className="flex items-center gap-2">
          <Label id="dashboard-view-label" className="text-xs text-muted-foreground">
            View
          </Label>
          <Select value={savedViewId} onValueChange={handleSavedViewChange} disabled={isSaving}>
            <SelectTrigger
              className="h-8 min-w-44"
              aria-labelledby="dashboard-view-label"
            >
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <PresetSelectItem key={p.id} preset={p} />
              ))}
              <SelectItem value="custom">Custom (your layout)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <fieldset className="flex items-center gap-2 border-0 p-0">
        <legend className="sr-only">Time range</legend>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('flex items-center gap-2', isSaving && 'pointer-events-none opacity-70')}>
              <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                <TabsList variant="default" className="h-8">
                  {(['mtd', 'qtd', 'ytd'] as const).map((tr) => (
                    <TabsTrigger key={tr} value={tr} className="px-3 text-xs">
                      {TIME_RANGE_LABELS[tr]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {getTimeRangeDateLabel(timeRange) || 'Select time range'}
          </TooltipContent>
        </Tooltip>
      </fieldset>
      <div className="flex items-center gap-2">
        <Label id="dashboard-compare-label" className="text-xs text-muted-foreground">
          Compare
        </Label>
        <Select value={comparisonMode} onValueChange={handleComparisonModeChange} disabled={isSaving}>
          <SelectTrigger
            className="h-8 min-w-44"
            aria-labelledby="dashboard-compare-label"
          >
            <SelectValue placeholder="Comparison" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(COMPARISON_LABELS) as ComparisonMode[]).map((m) => (
              <SelectItem key={m} value={m}>
                {COMPARISON_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isComparing && (
          <Badge variant="secondary" className="text-[10px] font-normal">
            {COMPARISON_LABELS[comparisonMode]}
          </Badge>
        )}
      </div>
      <div className={cn('flex items-center gap-2', isSaving && 'opacity-70')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-2">
              <Switch
                id="plain-language"
                checked={plainLanguage}
                onCheckedChange={handlePlainLanguageChange}
                size="sm"
                disabled={isSaving}
                aria-label="Use plain language labels"
              />
              <Label
                htmlFor="plain-language"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Plain language
              </Label>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            Use simpler labels (e.g. &quot;Money owed&quot; instead of &quot;Total Payables&quot;)
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div
      className={cn('flex flex-wrap items-center', ACTION_GAP)}
      data-testid="dashboard-header-bar"
      role="toolbar"
      aria-label="Dashboard filters"
    >
      <div className="hidden md:flex flex-wrap items-center">
        {isSaving && <Loader2 className={cn(ICON, 'animate-spin text-muted-foreground')} aria-hidden />}
        {controlsContent}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden gap-1.5"
            aria-label="Open dashboard filters"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className={cn(ICON, 'animate-spin')} /> : <Filter className={ICON} />}
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn(POPOVER_DOMAIN_W, 'p-0')}>
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle className="text-base">Dashboard filters</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-4 px-4 py-3">
            {presets.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">View</Label>
                  <Select value={savedViewId} onValueChange={handleSavedViewChange} disabled={isSaving}>
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((p) => (
                        <PresetSelectItem key={p.id} preset={p} />
                      ))}
                      <SelectItem value="custom">Custom (your layout)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </>
            )}
            <div className={cn('space-y-2', isSaving && 'pointer-events-none opacity-70')}>
              <Label className="text-xs text-muted-foreground">Time range</Label>
              <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                <TabsList variant="default" className="h-8 w-full">
                  {(['mtd', 'qtd', 'ytd'] as const).map((tr) => (
                    <TabsTrigger key={tr} value={tr} className="flex-1 text-xs">
                      {TIME_RANGE_LABELS[tr]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Compare</Label>
              <Select value={comparisonMode} onValueChange={handleComparisonModeChange} disabled={isSaving}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Comparison" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPARISON_LABELS) as ComparisonMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {COMPARISON_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <HelpCircle className={cn(ICON, 'text-muted-foreground')} />
                    <Label className="text-xs text-muted-foreground">Plain language</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56">
                  Simpler labels (e.g. &quot;Money owed&quot; vs &quot;Total Payables&quot;)
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={plainLanguage}
                onCheckedChange={handlePlainLanguageChange}
                size="sm"
                disabled={isSaving}
                aria-label="Use plain language labels"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
DashboardHeaderBar.displayName = 'DashboardHeaderBar';

// ─── Preset select item with optional description ────────────────────────────

function PresetSelectItem({ preset }: { preset: SavedViewPreset }) {
  return (
    <SelectItem value={preset.id} title={preset.description}>
      {preset.label}
    </SelectItem>
  );
}

export { DashboardHeaderBar };
export type { DashboardHeaderBarProps };

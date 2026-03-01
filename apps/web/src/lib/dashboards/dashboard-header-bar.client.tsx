'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashboardPrefs } from '@afenda/contracts';
import type { TimeRange } from '@afenda/contracts';
import type { DomainDashboardConfig } from './types';

// ─── Dashboard Header Bar (Client) ──────────────────────────────────────────
// Time range selector (MTD/QTD/YTD) + plain language toggle + saved view selector.
// Renders between page header and KPI deck.

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
  custom: 'Custom',
};

type ComparisonMode = 'none' | 'vs_prior_period' | 'vs_budget' | 'vs_plan';
const COMPARISON_LABELS: Record<ComparisonMode, string> = {
  none: 'No comparison',
  vs_prior_period: 'vs prior period',
  vs_budget: 'vs budget',
  vs_plan: 'vs plan',
};

interface DashboardHeaderBarProps {
  domainId: string;
  config: DomainDashboardConfig;
  prefs: DashboardPrefs;
  onSavePrefs: (domainId: string, prefs: DashboardPrefs) => Promise<void>;
}

function DashboardHeaderBar({
  domainId,
  config,
  prefs,
  onSavePrefs,
}: DashboardHeaderBarProps) {
  const timeRange = (prefs.timeRange ?? 'mtd') as TimeRange;
  const plainLanguage = prefs.plainLanguage ?? false;
  const comparisonMode = (prefs.comparisonMode ?? 'none') as ComparisonMode;
  const presets = config.savedViewPresets ?? [];
  const savedViewId =
    prefs.savedViewId ??
    (prefs.selectedWidgetIds?.length ? 'custom' : presets[0]?.id ?? 'custom');

  const handleTimeRangeChange = React.useCallback(
    (value: string) => {
      void onSavePrefs(domainId, {
        ...prefs,
        timeRange: value as TimeRange,
      });
    },
    [domainId, prefs, onSavePrefs],
  );

  const handlePlainLanguageChange = React.useCallback(
    (checked: boolean) => {
      void onSavePrefs(domainId, {
        ...prefs,
        plainLanguage: checked,
      });
    },
    [domainId, prefs, onSavePrefs],
  );

  const handleComparisonModeChange = React.useCallback(
    (value: string) => {
      void onSavePrefs(domainId, {
        ...prefs,
        comparisonMode: value === 'none' ? undefined : (value as ComparisonMode),
      });
    },
    [domainId, prefs, onSavePrefs],
  );

  const handleSavedViewChange = React.useCallback(
    (value: string) => {
      const preset = presets.find((p) => p.id === value);
      if (preset) {
        void onSavePrefs(domainId, {
          ...prefs,
          savedViewId: preset.id,
          selectedWidgetIds: preset.widgetIds,
          selectedChartId: preset.chartId,
          selectedDiagramId: preset.diagramId,
          widgetLayout: undefined,
        });
      } else {
        void onSavePrefs(domainId, {
          ...prefs,
          savedViewId: 'custom',
        });
      }
    },
    [domainId, prefs, onSavePrefs, presets],
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      {presets.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">View</Label>
          <Select value={savedViewId} onValueChange={handleSavedViewChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
        <TabsList variant="default" className="h-8">
          {(['mtd', 'qtd', 'ytd'] as const).map((tr) => (
            <TabsTrigger key={tr} value={tr} className="px-3 text-xs">
              {TIME_RANGE_LABELS[tr]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Compare</Label>
        <Select value={comparisonMode} onValueChange={handleComparisonModeChange}>
          <SelectTrigger className="h-8 w-[140px]">
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
      <div className="flex items-center gap-2">
        <Switch
          id="plain-language"
          checked={plainLanguage}
          onCheckedChange={handlePlainLanguageChange}
          size="sm"
        />
        <Label
          htmlFor="plain-language"
          className="cursor-pointer text-xs text-muted-foreground"
        >
          Plain language
        </Label>
      </div>
    </div>
  );
}
DashboardHeaderBar.displayName = 'DashboardHeaderBar';

export { DashboardHeaderBar };
export type { DashboardHeaderBarProps };

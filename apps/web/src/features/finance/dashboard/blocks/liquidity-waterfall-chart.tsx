'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';

/**
 * Waterfall data point
 */
interface WaterfallDataPoint {
  step: string;
  label: string;
  value: number;
  start: number;          // Cumulative before this step
  isTotal?: boolean;      // Opening/closing balances
  category: 'operating_in' | 'operating_out' | 'investing' | 'financing' | 'fx_reval' | 'total';
}

interface LiquidityWaterfallChartProps {
  data: WaterfallDataPoint[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
  mode?: 'actual' | 'forecast';
  onModeChange?: (mode: 'actual' | 'forecast') => void;
}

const WATERFALL_CONFIG = {
  operating_in: { label: 'Operating Inflows', color: 'var(--waterfall-positive)' },
  operating_out: { label: 'Operating Outflows', color: 'var(--waterfall-negative)' },
  investing: { label: 'Investing', color: 'var(--viz-accent-1)' },
  financing: { label: 'Financing', color: 'var(--viz-accent-2)' },
  fx_reval: { label: 'FX Revaluation', color: 'var(--viz-accent-3)' },
  total: { label: 'Balance', color: 'var(--waterfall-total)' },
} satisfies ChartConfig;

/**
 * Liquidity Waterfall Chart
 * 
 * Enterprise waterfall showing cash movements from opening to closing balance
 * - Actual mode: From bank statements / cash ledger
 * - Forecast mode: Treasury forecast
 * 
 * Stable steps:
 * - Opening cash
 * - Operating inflows/outflows
 * - Investing
 * - Financing
 * - FX revaluation (if multi-currency)
 * - Closing cash
 */
export function LiquidityWaterfallChart({
  data,
  _params,
  compact,
  _gridW = 2,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
  mode = 'actual',
  onModeChange,
}: LiquidityWaterfallChartProps) {
  const [displayMode, setDisplayMode] = useState<'actual' | 'forecast'>(mode);

  const handleModeChange = (value: string) => {
    if (value && (value === 'actual' || value === 'forecast')) {
      setDisplayMode(value);
      onModeChange?.(value);
    }
  };

  const margin = compact ? { top: 20, right: 8, left: 0, bottom: 8 } : { top: 20, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 10 : 12;

  return (
    <ChartCard
      title="Liquidity Waterfall"
      description={displayMode === 'actual' ? 'Actual cash movements' : 'Forecasted cash movements'}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
    >
      {/* Mode toggle */}
      {!compact && onModeChange && (
        <div className="mb-2 flex justify-end">
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={handleModeChange}
            size="sm"
          >
            <ToggleGroupItem value="actual" aria-label="Actual">
              Actual
            </ToggleGroupItem>
            <ToggleGroupItem value="forecast" aria-label="Forecast">
              Forecast
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <ChartContainer
        config={WATERFALL_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[300px] w-full'}
      >
        <BarChart
          data={data}
          margin={margin}
          accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatChartValue(value)}
            width={compact ? 40 : 60}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{name}:</span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatChartValue(typeof value === 'number' ? value : Number(value) || 0)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            onClick={(data) => {
              if (onDrilldown && data.category === 'operating_in') {
                onDrilldown({ kind: 'report', reportId: 'cashflow' });
              }
            }}
            className="cursor-pointer"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.step}`}
                fill={
                  entry.isTotal
                    ? WATERFALL_CONFIG.total.color
                    : entry.value >= 0
                    ? WATERFALL_CONFIG.operating_in.color
                    : WATERFALL_CONFIG.operating_out.color
                }
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value: number) => formatChartValue(value)}
              style={{ fontSize: compact ? 9 : 11, fill: 'currentColor' }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

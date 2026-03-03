'use client';

import { ChartCard } from '@/components/charts/chart-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import type { ChartParams, DrilldownTarget } from '@/components/charts';

/**
 * DSO data point
 */
interface DSODataPoint {
  period: string; // e.g. "Jan 2026"
  dso: number;
  dsoCompare?: number; // Prior period/year
  target?: number; // Target DSO
}

interface DSOTrendChartProps {
  data: DSODataPoint[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
  showSparkline?: boolean;
  _gridW?: number;
  _gridH?: number;
}

const DSO_CONFIG = {
  dso: { label: 'DSO (Current)', color: 'var(--chart-1)' },
  dsoCompare: { label: 'DSO (Prior)', color: 'var(--chart-2)' },
  target: { label: 'Target DSO', color: 'var(--viz-accent-2)' },
} satisfies ChartConfig;

/**
 * DSO Trend Chart
 *
 * Enterprise DSO (Days Sales Outstanding) trend line:
 * - Current period DSO
 * - Compare to prior period/year (dotted line)
 * - Target DSO (horizontal reference line)
 * - Optional sparkline mode for compact widgets
 *
 * Drilldown: AR Aging report
 */
export function DSOTrendChart({
  data,
  params,
  compact,
  _gridW = 2,
  _gridH = 1,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
  showSparkline = false,
}: DSOTrendChartProps) {
  const margin =
    compact || showSparkline
      ? { top: 5, right: 5, left: 0, bottom: 0 }
      : { top: 10, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 10 : 12;

  const currentDSO = data[data.length - 1]?.dso;
  const priorDSO = data[data.length - 2]?.dso;
  const change = currentDSO && priorDSO ? ((currentDSO - priorDSO) / priorDSO) * 100 : 0;

  if (showSparkline) {
    // Sparkline mode (for hero metrics)
    return (
      <div className="h-[60px] w-full">
        <ChartContainer config={DSO_CONFIG} className="h-full w-full">
          <AreaChart data={data} margin={margin}>
            <defs>
              <linearGradient id="dsoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="dso"
              stroke="var(--chart-1)"
              fill="url(#dsoGradient)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }

  return (
    <ChartCard
      title="DSO Trend"
      description={`Days Sales Outstanding: ${currentDSO?.toFixed(0)}d (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
      emptyStateKey="finance.dashboard.dsoTrend"
    >
      <ChartContainer
        config={DSO_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[220px] w-full'}
      >
        <LineChart
          data={data}
          margin={margin}
          accessibilityLayer
          onClick={() => {
            if (onDrilldown) {
              onDrilldown({ kind: 'report', reportId: 'ar-aging' });
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
            label={!compact ? { value: 'Days', angle: -90, position: 'insideLeft' } : undefined}
            width={compact ? 30 : 50}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{name}:</span>
                    <span className="font-mono font-medium tabular-nums">
                      {typeof value === 'number' ? `${value.toFixed(0)}d` : value}
                    </span>
                  </div>
                )}
              />
            }
          />
          {/* Target line */}
          {data[0]?.target && (
            <ReferenceLine
              y={data[0].target}
              stroke="var(--viz-accent-2)"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: 'Target', position: 'right', fill: 'currentColor', fontSize: 11 }}
            />
          )}
          {/* Current period */}
          <Line
            type="monotone"
            dataKey="dso"
            stroke="var(--chart-1)"
            strokeWidth={3}
            dot={{ fill: 'var(--chart-1)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {/* Compare period (if enabled) */}
          {params.compare !== 'none' && (
            <Line
              type="monotone"
              dataKey="dsoCompare"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'var(--chart-2)', r: 3 }}
            />
          )}
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

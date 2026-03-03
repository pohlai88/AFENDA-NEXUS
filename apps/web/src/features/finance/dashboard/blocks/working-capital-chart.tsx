'use client';

import { ChartCard } from '@/components/charts/chart-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';

/**
 * Working capital data point
 */
interface WorkingCapitalDataPoint {
  period: string;
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
}

interface WorkingCapitalChartProps {
  data: WorkingCapitalDataPoint[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
  _params?: unknown;
  _gridW?: number;
  _gridH?: number;
}

const WC_CONFIG = {
  currentAssets: { label: 'Current Assets', color: 'var(--chart-5)' },
  currentLiabilities: { label: 'Current Liabilities', color: 'var(--chart-3)' },
  netWorkingCapital: { label: 'Net Working Capital', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Working Capital Components Chart
 *
 * Enterprise working capital visualization (SAP Fiori pattern):
 * - Current Assets (bar)
 * - Current Liabilities (bar)
 * - Net Working Capital (line)
 *
 * Net WC = Current Assets - Current Liabilities
 *
 * Drilldown: Balance sheet
 */
export function WorkingCapitalChart({
  data,
  _params,
  compact,
  _gridW = 2,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
}: WorkingCapitalChartProps) {
  const margin = compact
    ? { top: 10, right: 8, left: 0, bottom: 8 }
    : { top: 10, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 10 : 12;

  return (
    <ChartCard
      title="Working Capital"
      description="Current assets vs liabilities with net WC trend"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
      emptyStateKey="finance.dashboard.workingCapital"
    >
      <ChartContainer
        config={WC_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[280px] w-full'}
      >
        <ComposedChart
          data={data}
          margin={margin}
          accessibilityLayer
          onClick={() => {
            if (onDrilldown) {
              onDrilldown({ kind: 'report', reportId: 'balance-sheet' });
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
          {!compact && <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />}
          <Bar
            dataKey="currentAssets"
            fill="var(--chart-5)"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
          />
          <Bar
            dataKey="currentLiabilities"
            fill="var(--chart-3)"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
          />
          <Line
            type="monotone"
            dataKey="netWorkingCapital"
            stroke="var(--chart-1)"
            strokeWidth={3}
            dot={{ fill: 'var(--chart-1)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartCard>
  );
}

'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';

/**
 * Tax liability data point
 */
interface TaxLiabilityDataPoint {
  period: string;
  outputTax: number;
  inputTax: number;
  netTax: number;
}

interface TaxLiabilityChartProps {
  data: TaxLiabilityDataPoint[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const TAX_CONFIG = {
  outputTax: { label: 'Output Tax', color: 'var(--chart-1)' },
  inputTax: { label: 'Input Tax', color: 'var(--chart-2)' },
  netTax: { label: 'Net Tax Payable', color: 'var(--chart-3)' },
} satisfies ChartConfig;

/**
 * Tax Liability Stacked Area Chart
 * 
 * Enterprise tax visualization:
 * - Output tax (VAT/GST collected)
 * - Input tax (VAT/GST paid)
 * - Net tax liability (output - input)
 * 
 * Drilldown: Tax summary report
 */
export function TaxLiabilityChart({
  data,
  _params,
  compact,
  _gridW = 2,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
}: TaxLiabilityChartProps) {
  const margin = compact ? { top: 10, right: 8, left: 0, bottom: 8 } : { top: 10, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 10 : 12;

  return (
    <ChartCard
      title="Tax Liability"
      description="Output tax, input tax, and net position over time"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
    >
      <ChartContainer
        config={TAX_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[260px] w-full'}
      >
        <AreaChart
          data={data}
          margin={margin}
          accessibilityLayer
          onClick={() => {
            if (onDrilldown) {
              onDrilldown({ kind: 'report', reportId: 'trial-balance' });
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
          <Area
            type="monotone"
            dataKey="outputTax"
            stackId="1"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="inputTax"
            stackId="1"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="netTax"
            stroke="var(--chart-3)"
            fill="var(--chart-3)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

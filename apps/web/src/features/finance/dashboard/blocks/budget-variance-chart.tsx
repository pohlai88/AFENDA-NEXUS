'use client';

import { ChartCard } from '@/components/charts/chart-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';
import { cn } from '@/lib/utils';

/**
 * Budget variance data point
 */
interface BudgetVarianceDataPoint {
  category: string; // GL account or department
  actual: number;
  budget: number;
  variance: number; // actual - budget
  variancePercent: number; // (actual - budget) / budget
  polarity: 'favorable' | 'unfavorable'; // Context-aware (revenue: over=good, expense: under=good)
}

interface BudgetVarianceChartProps {
  data: BudgetVarianceDataPoint[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
  type?: 'revenue' | 'expense';
  _params?: unknown;
  _gridW?: number;
  _gridH?: number;
}

const VARIANCE_CONFIG = {
  favorable: { label: 'Favorable', color: 'var(--viz-positive)' },
  unfavorable: { label: 'Unfavorable', color: 'var(--viz-negative)' },
  actual: { label: 'Actual', color: 'var(--chart-1)' },
  budget: { label: 'Budget', color: 'var(--viz-accent-2)' },
} satisfies ChartConfig;

/**
 * Budget vs Actual Variance Chart
 *
 * Enterprise budget variance analysis:
 * - Actual vs Budget (grouped bars)
 * - Variance bars with polarity-aware coloring
 * - Revenue: over budget = favorable (green)
 * - Expense: under budget = favorable (green)
 * - Variance % labels
 *
 * Drilldown: GL trial balance filtered by account
 */
export function BudgetVarianceChart({
  data,
  _params,
  compact,
  _gridW = 2,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
  type = 'expense',
}: BudgetVarianceChartProps) {
  const margin = compact
    ? { top: 20, right: 8, left: 0, bottom: 8 }
    : { top: 20, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 10 : 12;

  return (
    <ChartCard
      title={`Budget Variance${type === 'revenue' ? ' (Revenue)' : ' (Expense)'}`}
      description="Actual vs budget with polarity-aware variance"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
      emptyStateKey="finance.dashboard.budgetVariance"
    >
      <ChartContainer
        config={VARIANCE_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[300px] w-full'}
      >
        <BarChart
          data={data}
          margin={margin}
          accessibilityLayer
          layout="vertical"
          onClick={() => {
            if (onDrilldown) {
              onDrilldown({ kind: 'report', reportId: 'trial-balance' });
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatChartValue(value)}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fill: 'currentColor', fontSize: tickFontSize }}
            tickLine={false}
            axisLine={false}
            width={compact ? 80 : 120}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, props) => {
                  const { payload } = props;
                  return (
                    <div className="space-y-1">
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Actual:</span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatChartValue(payload.actual)}
                        </span>
                      </div>
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatChartValue(payload.budget)}
                        </span>
                      </div>
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Variance:</span>
                        <span
                          className={cn(
                            'font-mono font-medium tabular-nums',
                            payload.polarity === 'favorable' ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {formatChartValue(payload.variance)} (
                          {payload.variancePercent > 0 ? '+' : ''}
                          {payload.variancePercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payload.polarity === 'favorable' ? '✓ Favorable' : '✗ Unfavorable'}
                      </div>
                    </div>
                  );
                }}
              />
            }
          />
          {/* Budget (background) */}
          <Bar
            dataKey="budget"
            fill="var(--viz-accent-2)"
            radius={[0, 4, 4, 0]}
            fillOpacity={0.3}
          />
          {/* Actual (foreground with polarity color) */}
          <Bar dataKey="actual" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={
                  entry.polarity === 'favorable'
                    ? VARIANCE_CONFIG.favorable.color
                    : VARIANCE_CONFIG.unfavorable.color
                }
              />
            ))}
            <LabelList
              dataKey="variancePercent"
              position="right"
              formatter={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
              style={{ fontSize: compact ? 9 : 11, fill: 'currentColor' }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

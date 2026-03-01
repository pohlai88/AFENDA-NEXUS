'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from 'recharts';
import type { ChartParams, DrilldownTarget } from '@/components/charts';
import { cn } from '@/lib/utils';

/**
 * Ratio gauge data point
 */
interface RatioGaugeData {
  metricId: string;
  label: string;
  value: number;
  target?: number;
  threshold: {
    danger: number;    // Red zone
    warning: number;   // Yellow zone
    success: number;   // Green zone
  };
  unit: 'ratio' | 'percent' | 'days';
  definition: string;  // Tooltip explanation
}

interface FinancialRatiosChartProps {
  data: RatioGaugeData[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const RATIOS_CONFIG = {
  value: { label: 'Current', color: 'var(--chart-1)' },
  target: { label: 'Target', color: 'var(--viz-accent-2)' },
} satisfies ChartConfig;

/**
 * Single Ratio Gauge Component
 */
function RatioGauge({ ratio, compact }: { ratio: RatioGaugeData; compact?: boolean }) {
  const percentage = Math.min((ratio.value / ratio.threshold.success) * 100, 100);
  
  // Determine zone color
  const getZoneColor = (value: number) => {
    if (value >= ratio.threshold.success) return 'var(--gauge-success)';
    if (value >= ratio.threshold.warning) return 'var(--gauge-warning)';
    return 'var(--gauge-danger)';
  };

  const zoneColor = getZoneColor(ratio.value);

  const chartData = [
    {
      metric: ratio.label,
      value: percentage,
      fill: zoneColor,
    },
  ];

  return (
    <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-2')}>
      <ChartContainer
        config={RATIOS_CONFIG}
        className={compact ? 'h-[100px]' : 'h-[140px]'}
      >
        <RadialBarChart
          data={chartData}
          startAngle={180}
          endAngle={0}
          innerRadius={compact ? 50 : 70}
          outerRadius={compact ? 75 : 110}
        >
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 8}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {ratio.unit === 'ratio' 
                          ? ratio.value.toFixed(2)
                          : ratio.unit === 'percent'
                          ? `${ratio.value.toFixed(1)}%`
                          : `${ratio.value.toFixed(0)}d`
                        }
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 12}
                        className="fill-muted-foreground text-xs"
                      >
                        {ratio.target && `Target: ${ratio.target.toFixed(ratio.unit === 'ratio' ? 2 : 0)}`}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
          <RadialBar
            dataKey="value"
            cornerRadius={compact ? 4 : 6}
            fill={zoneColor}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="text-center space-y-1">
        <h4 className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{ratio.label}</h4>
        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2" title={ratio.definition}>
            {ratio.definition}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Financial Ratios Dial Chart
 * 
 * Enterprise gauges for key financial ratios:
 * - Current Ratio
 * - Quick Ratio
 * - DSO (Days Sales Outstanding)
 * - Debt-to-Equity
 * - Hedge Effectiveness
 * 
 * Each gauge shows:
 * - Current value
 * - Target (dashed line)
 * - Zone coloring (danger/warning/success)
 * - Definition tooltip
 */
export function FinancialRatiosChart({
  data,
  _params,
  compact,
  _gridW = 4,
  _gridH = 2,
  _onDrilldown,
  lastUpdated,
  isLoading,
  error,
}: FinancialRatiosChartProps) {
  return (
    <ChartCard
      title="Financial Ratios"
      description="Key financial health indicators"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
    >
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'
      )}>
        {data.map((ratio) => (
          <RatioGauge key={ratio.metricId} ratio={ratio} compact={compact} />
        ))}
      </div>
    </ChartCard>
  );
}

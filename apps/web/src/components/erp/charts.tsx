'use client';

/**
 * Lightweight chart primitives built on recharts for the dashboard.
 *
 * These wrap recharts components with Afenda design system styling
 * (CSS variables, density-aware sizing, dark mode support).
 *
 * Behind FEATURE_DASHBOARD_CHARTS flag — charts render only when enabled.
 */

import * as React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Chart Container ─────────────────────────────────────────────────────────

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartContainer({ children, className, height = 300 }: ChartContainerProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

// ─── Shared Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Area Chart ──────────────────────────────────────────────────────────────

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  className?: string;
  formatter?: (value: number) => string;
  stacked?: boolean;
}

const DEFAULT_COLORS = [
  'hsl(var(--chart-1, 220 70% 50%))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

export function AreaChartWidget({
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  className,
  formatter,
  stacked = false,
}: AreaChartProps) {
  return (
    <ChartContainer height={height} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground text-xs"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground text-xs"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? 'stack' : undefined}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        {yKeys.length > 1 && <Legend />}
      </RechartsAreaChart>
    </ChartContainer>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  className?: string;
  formatter?: (value: number) => string;
  stacked?: boolean;
}

export function BarChartWidget({
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  className,
  formatter,
  stacked = false,
}: BarChartProps) {
  return (
    <ChartContainer height={height} className={className}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground text-xs"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground text-xs"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={stacked ? 'stack' : undefined}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {yKeys.length > 1 && <Legend />}
      </RechartsBarChart>
    </ChartContainer>
  );
}

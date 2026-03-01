'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Label,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
} from 'recharts';
import type { CashFlowDataPoint, RevenueExpenseDataPoint, AgingBucket } from '../types';
import { formatChartValue } from './chart-utils';

// ─── Chart Config (shadcn ChartConfig — design tokens via config, no hardcoding) ───

const CASH_FLOW_CHART_CONFIG = {
  month: { label: 'Month' },
  inflows: { label: 'Inflows', color: 'var(--chart-5)' },
  outflows: { label: 'Outflows', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const REVENUE_EXPENSE_CHART_CONFIG = {
  month: { label: 'Month' },
  revenue: { label: 'Revenue', color: 'var(--chart-5)' },
  expenses: { label: 'Expenses', color: 'var(--chart-3)' },
} satisfies ChartConfig;

/** Aging bucket config — design tokens from config, no hardcoded palette
 * Color progression: blue (current/good) → teal → gold → orange (aging) → purple (very old)
 */
const AGING_CHART_CONFIG = {
  range: { label: 'Bucket' },
  amount: { label: 'Amount' },
  current: { label: 'Current', color: 'var(--chart-1)' },
  '1-30': { label: '1-30', color: 'var(--chart-2)' },
  '31-60': { label: '31-60', color: 'var(--chart-4)' },
  '61-90': { label: '61-90', color: 'var(--chart-3)' },
  '90+': { label: '90+', color: 'var(--chart-6)' },
  other: { label: 'Other', color: 'var(--chart-7)' },
} satisfies ChartConfig;

const AGING_RANGE_KEYS = ['current', '1-30', '31-60', '61-90', '90+'] as const;

function getAgingConfigKey(range: string): (typeof AGING_RANGE_KEYS)[number] | 'other' {
  const r = range.trim();
  const normalized = r.toLowerCase();
  if (normalized === 'current') return 'current';
  if (AGING_RANGE_KEYS.includes(r as (typeof AGING_RANGE_KEYS)[number])) return r as (typeof AGING_RANGE_KEYS)[number];
  return 'other';
}

// ─── Currency formatter for ChartTooltipContent ───────────────────────────────

function currencyFormatter(value: unknown, name: string, item: { color?: string }) {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px] border border-border bg-background"
        style={{ backgroundColor: item.color } as React.CSSProperties}
      />
      <div className="flex flex-1 justify-between leading-none">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono font-medium tabular-nums">{formatChartValue(num)}</span>
      </div>
    </div>
  );
}

// ─── Cash Flow Chart ─────────────────────────────────────────────────────────

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  /** Compact mode: fills container, smaller header — for bento grid. */
  compact?: boolean;
  /** Grid width in units (1–3). Affects chart density. */
  gridW?: number;
  /** Grid height in units (1–3). Affects chart density. */
  gridH?: number;
}

export function CashFlowChart({ data, compact, _gridW = 2, _gridH = 2 }: CashFlowChartProps) {
  const margin = compact ? { top: 8, right: 8, left: 0, bottom: 8 } : { top: 10, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 11 : undefined;
  return (
    <Card className={compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : undefined}>
      <CardHeader className={compact ? 'shrink-0 px-3 py-2' : undefined}>
        <CardTitle className={compact ? 'text-sm font-medium' : undefined}>Cash Flow</CardTitle>
        {!compact && <CardDescription>Monthly inflows vs outflows</CardDescription>}
      </CardHeader>
      <CardContent className={compact ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-0' : undefined}>
        <ChartContainer
          config={CASH_FLOW_CHART_CONFIG}
          className={compact ? 'relative min-h-[160px] min-w-0 flex-1 w-full aspect-video' : 'min-h-[200px] w-full aspect-video'}
        >
          <BarChart data={data} margin={margin} barCategoryGap={12} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: tickFontSize }}
              tickLine={{ stroke: 'currentColor' }}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: tickFontSize }}
              tickLine={{ stroke: 'currentColor' }}
              axisLine={false}
              tickFormatter={(value) => formatChartValue(value)}
              width={36}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => currencyFormatter(value, String(name), item as { color?: string })}
                />
              }
            />
            <Bar
              dataKey="inflows"
              name="Inflows"
              fill="var(--color-inflows)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="outflows"
              name="Outflows"
              fill="var(--color-outflows)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Revenue & Expenses Chart ────────────────────────────────────────────────

interface RevenueExpenseChartProps {
  data: RevenueExpenseDataPoint[];
  /** Compact mode: fills container, smaller header — for bento grid. */
  compact?: boolean;
  /** Grid width in units (1–3). */
  gridW?: number;
  /** Grid height in units (1–3). */
  gridH?: number;
}

export function RevenueExpenseChart({ data, compact, _gridW = 2, _gridH = 2 }: RevenueExpenseChartProps) {
  const margin = compact ? { top: 8, right: 8, left: 0, bottom: 8 } : { top: 10, right: 10, left: 0, bottom: 0 };
  const tickFontSize = compact ? 11 : undefined;
  return (
    <Card className={compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : undefined}>
      <CardHeader className={compact ? 'shrink-0 px-3 py-2' : undefined}>
        <CardTitle className={compact ? 'text-sm font-medium' : undefined}>Revenue & Expenses</CardTitle>
        {!compact && <CardDescription>Monthly P&L trend</CardDescription>}
      </CardHeader>
      <CardContent className={compact ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-0' : undefined}>
        <ChartContainer
          config={REVENUE_EXPENSE_CHART_CONFIG}
          className={compact ? 'relative min-h-[160px] min-w-0 flex-1 w-full aspect-video' : 'min-h-[200px] w-full aspect-video'}
        >
          <AreaChart data={data} margin={margin} accessibilityLayer>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: tickFontSize }}
              tickLine={{ stroke: 'currentColor' }}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: tickFontSize }}
              tickLine={{ stroke: 'currentColor' }}
              axisLine={false}
              tickFormatter={(value) => formatChartValue(value)}
              width={36}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => currencyFormatter(value, String(name), item as { color?: string })}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--color-revenue)"
              fill="url(#revenueGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--color-expenses)"
              fill="url(#expensesGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Aging Radial Bar (shadcn best practice — replaces basic donut) ─────────

interface AgingRadialChartProps {
  data: AgingBucket[];
  title: string;
  description: string;
  /** Compact mode: fills container — for bento grid. */
  compact?: boolean;
  /** Grid width (1–3). Smaller = denser layout. */
  gridW?: number;
  /** Grid height (1–3). */
  gridH?: number;
}

/** 
 * Radial bar chart for AR/AP aging — shadcn enterprise pattern.
 * Uses stacked radial bars for clear visual hierarchy per aging bucket.
 * Superior to basic donut: better separation, more professional, space-efficient.
 */
function AgingRadialChart({ data, title, description, compact, gridW = 2, gridH = 2 }: AgingRadialChartProps) {
  const total = data.reduce((sum, bucket) => sum + bucket.amount, 0);
  const isMinimal = (gridW ?? 2) === 1 && (gridH ?? 2) === 1;
  
  // Map data with fill from config (shadcn pattern — no hardcoded colors)
  const chartData = [
    data.reduce((acc, bucket) => {
      const key = getAgingConfigKey(bucket.range);
      return { ...acc, [key]: bucket.amount };
    }, {} as Record<string, number>)
  ];

  return (
    <Card className={compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : undefined}>
      <CardHeader className={compact ? 'shrink-0 px-3 py-1.5' : undefined}>
        <CardTitle className={compact ? 'text-sm font-medium' : undefined}>{title}</CardTitle>
        {!compact && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={compact ? 'flex min-h-0 flex-1 items-center pb-2 px-2 pt-0' : 'flex items-center pb-0'}>
        <ChartContainer
          config={AGING_CHART_CONFIG}
          className={compact ? 'mx-auto aspect-square w-full max-w-[200px]' : 'mx-auto aspect-square w-full max-w-[250px]'}
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={isMinimal ? '50%' : '60%'}
            outerRadius={isMinimal ? '85%' : '90%'}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold tabular-nums"
                        >
                          {formatChartValue(total)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground text-xs"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
            {AGING_RANGE_KEYS.map((key, _index) => (
              <RadialBar
                key={key}
                dataKey={key}
                stackId="aging"
                cornerRadius={3}
                fill={`var(--color-${key})`}
                className="stroke-transparent stroke-2"
              />
            ))}
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {!isMinimal && (
        <CardFooter className={compact ? 'px-3 pb-2 pt-1' : 'pt-0'}>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
            {AGING_RANGE_KEYS.map((key) => {
              const config = AGING_CHART_CONFIG[key];
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── AR Aging Chart ──────────────────────────────────────────────────────────

export function ARAgingChart({ data, compact, gridW, gridH }: { data: AgingBucket[]; compact?: boolean; gridW?: number; gridH?: number }) {
  return (
    <AgingRadialChart
      data={data}
      title="AR Aging"
      description="Receivables by age bucket"
      compact={compact}
      gridW={gridW}
      gridH={gridH}
    />
  );
}

// ─── AP Aging Chart ──────────────────────────────────────────────────────────

export function APAgingChart({ data, compact, gridW, gridH }: { data: AgingBucket[]; compact?: boolean; gridW?: number; gridH?: number }) {
  return (
    <AgingRadialChart
      data={data}
      title="AP Aging"
      description="Payables by age bucket"
      compact={compact}
      gridW={gridW}
      gridH={gridH}
    />
  );
}

// ─── Combined Chart Widget with Tabs ─────────────────────────────────────────

interface DashboardChartsProps {
  cashFlowData: CashFlowDataPoint[];
  revenueExpenseData: RevenueExpenseDataPoint[];
  arAgingData: AgingBucket[];
}

export function DashboardCharts({
  cashFlowData,
  revenueExpenseData,
  arAgingData,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Tabs defaultValue="cashflow" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="revenue">Revenue & Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="cashflow" className="space-y-4">
            <CashFlowChart data={cashFlowData} />
          </TabsContent>
          <TabsContent value="revenue" className="space-y-4">
            <RevenueExpenseChart data={revenueExpenseData} />
          </TabsContent>
        </Tabs>
      </div>
      <ARAgingChart data={arAgingData} />
    </div>
  );
}

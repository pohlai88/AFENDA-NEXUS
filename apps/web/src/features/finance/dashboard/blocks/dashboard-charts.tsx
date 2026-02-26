'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { CashFlowDataPoint, RevenueExpenseDataPoint, AgingBucket } from '../types';

// ─── Chart Colors ────────────────────────────────────────────────────────────

const CHART_COLORS = {
  inflows: 'hsl(145, 50%, 45%)',
  outflows: 'hsl(25, 70%, 55%)',
  net: 'hsl(220, 60%, 55%)',
  revenue: 'hsl(145, 50%, 45%)',
  expenses: 'hsl(25, 70%, 55%)',
  profit: 'hsl(220, 60%, 55%)',
};

const AGING_COLORS = [
  'hsl(145, 50%, 45%)', // Current - green
  'hsl(200, 60%, 50%)', // 1-30 - blue
  'hsl(45, 80%, 50%)', // 31-60 - yellow
  'hsl(25, 70%, 55%)', // 61-90 - orange
  'hsl(0, 65%, 55%)', // 90+ - red
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">${(entry.value / 1000).toFixed(0)}K</span>
        </div>
      ))}
    </div>
  );
}

// ─── Cash Flow Chart ─────────────────────────────────────────────────────────

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Monthly inflows vs outflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                tickFormatter={(value) => `$${value / 1000}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="inflows"
                name="Inflows"
                fill={CHART_COLORS.inflows}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outflows"
                name="Outflows"
                fill={CHART_COLORS.outflows}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Revenue & Expenses Chart ────────────────────────────────────────────────

interface RevenueExpenseChartProps {
  data: RevenueExpenseDataPoint[];
}

export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Expenses</CardTitle>
        <CardDescription>Monthly P&L trend</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                tickFormatter={(value) => `$${value / 1000}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CHART_COLORS.revenue}
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke={CHART_COLORS.expenses}
                fill="url(#expensesGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AR Aging Chart ──────────────────────────────────────────────────────────

interface ARAgingChartProps {
  data: AgingBucket[];
}

export function ARAgingChart({ data }: ARAgingChartProps) {
  const total = data.reduce((sum, bucket) => sum + bucket.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AR Aging</CardTitle>
        <CardDescription>Receivables by age bucket</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="range"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={AGING_COLORS[index % AGING_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => [
                  `$${((value ?? 0) / 1000).toFixed(0)}K`,
                  'Amount',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
          <div className="text-2xl font-bold tabular-nums">${(total / 1000000).toFixed(2)}M</div>
          <div className="text-sm text-muted-foreground">Total Outstanding</div>
        </div>
      </CardContent>
    </Card>
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

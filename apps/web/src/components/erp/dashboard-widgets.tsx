'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChartWidget, BarChartWidget } from '@/components/erp/charts';
import { routes } from '@/lib/constants';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  FilePlus2,
  FileText,
  UserPlus,
  Receipt,
  BarChart3,
  Keyboard,
} from 'lucide-react';

// ─── Feature Flag ────────────────────────────────────────────────────────────

const FEATURE_DASHBOARD_CHARTS = process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_CHARTS !== 'false';

// ─── Default Chart Data (API-first, fallback when no props supplied) ─────────

const FALLBACK_CASH_FLOW_DATA = [
  { month: 'Sep', inflow: 124000, outflow: 98000 },
  { month: 'Oct', inflow: 156000, outflow: 112000 },
  { month: 'Nov', inflow: 142000, outflow: 128000 },
  { month: 'Dec', inflow: 189000, outflow: 145000 },
  { month: 'Jan', inflow: 167000, outflow: 134000 },
  { month: 'Feb', inflow: 178000, outflow: 142000 },
];

const FALLBACK_EXPENSE_BREAKDOWN_DATA = [
  { category: 'Payroll', amount: 85000 },
  { category: 'Rent', amount: 12000 },
  { category: 'Software', amount: 8500 },
  { category: 'Travel', amount: 4200 },
  { category: 'Marketing', amount: 6800 },
  { category: 'Utilities', amount: 2100 },
];

const FALLBACK_AR_AGING_DATA = [
  { bucket: 'Current', amount: 45000 },
  { bucket: '1-30', amount: 22000 },
  { bucket: '31-60', amount: 8500 },
  { bucket: '61-90', amount: 3200 },
  { bucket: '90+', amount: 1800 },
];

// ─── Quick Shortcuts ─────────────────────────────────────────────────────────

const QUICK_SHORTCUTS = [
  {
    title: 'New Journal Entry',
    href: routes.finance.journalNew,
    icon: FilePlus2,
    shortcut: 'g n j',
  },
  { title: 'New Invoice', href: routes.finance.payableNew, icon: FileText },
  { title: 'New Supplier', href: routes.finance.supplierNew, icon: UserPlus },
  { title: 'New Expense', href: routes.finance.expenseNew, icon: Receipt },
];

// ─── Money Formatter ─────────────────────────────────────────────────────────

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

// ─── Dashboard Widgets ───────────────────────────────────────────────────────

/** Props for optional server-supplied chart data. Falls back to default data. */
export interface DashboardWidgetsProps {
  cashFlowData?: { month: string; inflow: number; outflow: number }[];
  expenseData?: { category: string; amount: number }[];
  arAgingData?: { bucket: string; amount: number }[];
}

/**
 * Dashboard v2 widget sections rendered below the KPI cards and activity feed.
 * Behind FEATURE_DASHBOARD_CHARTS flag.
 */
export function DashboardWidgets({
  cashFlowData,
  expenseData,
  arAgingData,
}: DashboardWidgetsProps = {}) {
  return (
    <div className="space-y-6">
      {/* Quick Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Keyboard className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_SHORTCUTS.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={shortcut.href}
                  variant="outline"
                  className="h-auto flex-col gap-1.5 py-3"
                  asChild
                >
                  <Link href={shortcut.href}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-xs">{shortcut.title}</span>
                    {shortcut.shortcut && (
                      <kbd className="mt-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {shortcut.shortcut}
                      </kbd>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section — rendering-conditional-render: use ternary for explicit conditional */}
      {FEATURE_DASHBOARD_CHARTS ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Cash Flow Trend */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Cash Flow Trend
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    Inflow
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDownLeft className="h-3 w-3 text-destructive" />
                    Outflow
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <AreaChartWidget
                data={cashFlowData ?? FALLBACK_CASH_FLOW_DATA}
                xKey="month"
                yKeys={['inflow', 'outflow']}
                colors={['hsl(160 60% 45%)', 'hsl(350 70% 55%)']}
                height={250}
                formatter={formatCompact}
              />
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <BarChartWidget
                data={expenseData ?? FALLBACK_EXPENSE_BREAKDOWN_DATA}
                xKey="category"
                yKeys={['amount']}
                colors={['hsl(220 70% 50%)']}
                height={250}
                formatter={formatCompact}
              />
            </CardContent>
          </Card>

          {/* AR Aging */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <ArrowUpRight className="h-4 w-4" />
                  Receivables Aging
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link href={routes.finance.receivables}>View all →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <BarChartWidget
                data={arAgingData ?? FALLBACK_AR_AGING_DATA}
                xKey="bucket"
                yKeys={['amount']}
                colors={['hsl(30 80% 55%)']}
                height={200}
                formatter={formatCompact}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
DashboardWidgets.displayName = 'DashboardWidgets';

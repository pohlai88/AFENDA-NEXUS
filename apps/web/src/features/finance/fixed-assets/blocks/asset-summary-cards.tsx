'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  Box,
  TrendingDown,
  Banknote,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import type { AssetSummary } from '../types';

interface AssetSummaryCardsProps {
  summary: AssetSummary;
  currency?: string;
}

export function AssetSummaryCards({ summary, currency = 'USD' }: AssetSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Assets */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Box className="h-4 w-4" />
            <CardDescription>Total Assets</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalAssets}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-success">{summary.activeAssets} active</span>
            <span>•</span>
            <span>{summary.fullyDepreciatedAssets} fully depreciated</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Original Cost */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-accent-foreground">
            <Banknote className="h-4 w-4" />
            <CardDescription>Original Cost</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(summary.totalOriginalCost, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Total asset value at acquisition</p>
        </CardContent>
      </Card>

      {/* Net Book Value */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-success">
            <TrendingDown className="h-4 w-4" />
            <CardDescription>Net Book Value</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-success">
            {formatCurrency(summary.totalNetBookValue, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            After {formatCurrency(summary.totalAccumulatedDepreciation, currency)} depreciation
          </p>
        </CardContent>
      </Card>

      {/* Monthly Depreciation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-warning">
            <Calculator className="h-4 w-4" />
            <CardDescription>Monthly Depreciation</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-destructive">
            {formatCurrency(summary.monthlyDepreciation, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Expense per month</p>
        </CardContent>
      </Card>

      {/* Pending Disposals Alert */}
      {summary.pendingDisposals > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4 border-warning/30 dark:border-warning/30 bg-warning/10 dark:bg-warning/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">Pending Disposals</p>
                <p className="text-sm text-muted-foreground">
                  {summary.pendingDisposals} asset disposal{summary.pendingDisposals !== 1 && 's'}{' '}
                  awaiting approval
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.fixedAssets}/disposals`}>View Disposals</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

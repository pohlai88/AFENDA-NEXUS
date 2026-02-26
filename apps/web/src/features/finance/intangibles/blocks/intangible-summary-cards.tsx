'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  Lightbulb,
  TrendingDown,
  Banknote,
  AlertTriangle,
  Calculator,
  Search,
} from 'lucide-react';
import type { IntangibleSummary } from '../types';

interface IntangibleSummaryCardsProps {
  summary: IntangibleSummary;
  currency?: string;
}

export function IntangibleSummaryCards({ summary, currency = 'USD' }: IntangibleSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Assets */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-purple-500">
            <Lightbulb className="h-4 w-4" />
            <CardDescription>Total Intangibles</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalAssets}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-green-600">{summary.activeAssets} active</span>
            <span>•</span>
            <span>{summary.fullyAmortizedAssets} fully amortized</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Original Cost */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Banknote className="h-4 w-4" />
            <CardDescription>Original Cost</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(summary.totalOriginalCost, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Total cost at acquisition</p>
        </CardContent>
      </Card>

      {/* Carrying Amount */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-green-500">
            <TrendingDown className="h-4 w-4" />
            <CardDescription>Carrying Amount</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
            {formatCurrency(summary.totalCarryingAmount, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.totalAccumulatedAmortization, currency)} amortized
            {summary.totalImpairmentLoss > 0 && (
              <>, {formatCurrency(summary.totalImpairmentLoss, currency)} impaired</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Amortization */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-amber-500">
            <Calculator className="h-4 w-4" />
            <CardDescription>Monthly Amortization</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
            {formatCurrency(summary.monthlyAmortization, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Expense per month</p>
        </CardContent>
      </Card>

      {/* Impairment Test Alert */}
      {summary.assetsRequiringImpairmentTest > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Impairment Tests Due</p>
                <p className="text-sm text-muted-foreground">
                  {summary.assetsRequiringImpairmentTest} asset{summary.assetsRequiringImpairmentTest !== 1 && 's'} require annual impairment testing
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.intangibles}?filter=impairment_due`}>
                View Assets
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

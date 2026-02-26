'use client';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Receipt,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import type { TaxSummary } from '../types';

interface TaxSummaryCardsProps {
  summary: TaxSummary;
  currency?: string;
}

export function TaxSummaryCards({ summary, currency = 'THB' }: TaxSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Output Tax */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive">
            <ArrowUpRight className="h-4 w-4" />
            <CardDescription>Output Tax</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(summary.outputTaxTotal, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Tax collected on sales</p>
        </CardContent>
      </Card>

      {/* Input Tax */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-success">
            <ArrowDownLeft className="h-4 w-4" />
            <CardDescription>Input Tax</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(summary.inputTaxTotal, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Tax paid on purchases</p>
        </CardContent>
      </Card>

      {/* Net Payable */}
      <Card
        className={cn(summary.netPayable > 0 && 'border-destructive/30 dark:border-destructive/30')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-warning">
            <Banknote className="h-4 w-4" />
            <CardDescription>Net Payable</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold font-mono',
              summary.netPayable > 0 ? 'text-destructive' : 'text-success'
            )}
          >
            {formatCurrency(summary.netPayable, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.netPayable > 0 ? 'Amount owed to tax authority' : 'Credit with tax authority'}
          </p>
        </CardContent>
      </Card>

      {/* WHT Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Receipt className="h-4 w-4" />
            <CardDescription>Withholding Tax</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-lg font-bold font-mono text-success">
                +{formatCurrency(summary.whtCollected, currency)}
              </div>
              <p className="text-xs text-muted-foreground">Collected</p>
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-destructive">
                -{formatCurrency(summary.whtPaid, currency)}
              </div>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Returns Alert */}
      {(summary.pendingReturns > 0 || summary.overdueReturns > 0) && (
        <Card className="sm:col-span-2 lg:col-span-4 border-warning/30 dark:border-warning/30 bg-warning/10 dark:bg-warning/20">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium">Tax Returns Pending</p>
              <p className="text-sm text-muted-foreground">
                {summary.pendingReturns} return{summary.pendingReturns !== 1 && 's'} pending
                {summary.overdueReturns > 0 && (
                  <span className="text-destructive font-medium">
                    ({summary.overdueReturns} overdue)
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

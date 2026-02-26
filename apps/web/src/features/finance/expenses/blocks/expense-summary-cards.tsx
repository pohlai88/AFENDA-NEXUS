'use client';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Receipt,
  Clock,
  CheckCircle,
  Banknote,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { ExpenseSummary } from '../types';

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary;
  currency?: string;
}

export function ExpenseSummaryCards({ summary, currency = 'USD' }: ExpenseSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Claims */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Receipt className="h-4 w-4" />
            <CardDescription>Total Claims</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalClaims}</div>
          <p className="text-xs text-muted-foreground">
            {summary.approvedThisMonth} approved this month
          </p>
        </CardContent>
      </Card>

      {/* Pending Claims */}
      <Card className={cn(summary.pendingClaims > 5 && 'border-amber-200 dark:border-amber-800')}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <CardDescription>Pending Approval</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.pendingClaims}</div>
          <p className="text-xs text-muted-foreground font-mono">
            {formatCurrency(summary.pendingAmount, currency)} pending
          </p>
        </CardContent>
      </Card>

      {/* Approved Amount */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <CardDescription>Approved</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
            {formatCurrency(summary.approvedAmount, currency)}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      {/* Paid This Month */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-emerald-500">
            <Banknote className="h-4 w-4" />
            <CardDescription>Paid</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(summary.paidThisMonth, currency)}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      {/* Processing Metrics */}
      <Card className="sm:col-span-2 lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-purple-500">
            <TrendingUp className="h-4 w-4" />
            <CardDescription>Processing Metrics</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{summary.averageProcessingDays} days</div>
              <p className="text-xs text-muted-foreground">Avg. processing time</p>
            </div>
            <div>
              <div className={cn(
                'text-2xl font-bold',
                summary.rejectionRate > 10 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              )}>
                {summary.rejectionRate}%
              </div>
              <p className="text-xs text-muted-foreground">Rejection rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Alert */}
      {summary.pendingClaims > 5 && (
        <Card className="sm:col-span-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">High Volume of Pending Claims</p>
              <p className="text-sm text-muted-foreground">
                {summary.pendingClaims} claims are awaiting approval
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

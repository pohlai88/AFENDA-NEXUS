'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MoneyCell } from '@/components/erp/money-cell';
import { DrilldownRow } from '@/components/erp/drilldown';
import { routes } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

// ─── Variance Alerts Panel ───────────────────────────────────────────────────

interface VarianceAlert {
  accountCode: string;
  accountName: string;
  severity: 'WARNING' | 'CRITICAL';
  variancePct: number;
}

function alertBadge(severity: 'WARNING' | 'CRITICAL') {
  return severity === 'CRITICAL' ? 'destructive' : ('outline' as const);
}

function varianceColor(pct: number): string {
  if (Math.abs(pct) < 5) return 'text-muted-foreground';
  if (pct > 0) return 'text-success';
  return 'text-destructive';
}

export function VarianceAlertsPanel({ alerts }: { alerts: VarianceAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-md border border-warning/30 bg-warning/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        Variance Alerts ({alerts.length})
      </div>
      <div className="grid gap-2">
        {alerts.map((a, i) => (
          <div
            key={`${a.accountCode}-${i}`}
            className="flex items-center justify-between rounded border bg-background p-2 text-sm"
          >
            <span>
              <span className="font-mono font-medium">{a.accountCode}</span> {a.accountName}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={alertBadge(a.severity)}>{a.severity}</Badge>
              <span className={varianceColor(a.variancePct)}>
                {a.variancePct > 0 ? '+' : ''}
                {a.variancePct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variance Table ──────────────────────────────────────────────────────────

interface VarianceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePct: number;
}

interface VarianceTableProps {
  rows: VarianceRow[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
}

export function BudgetVarianceTable({ rows, totalBudget, totalActual, totalVariance }: VarianceTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Budget variance report</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <DrilldownRow key={row.accountCode} href={routes.finance.accountDetail(row.accountId)}>
              <TableCell>
                <span className="font-mono text-muted-foreground">{row.accountCode}</span>{' '}
                {row.accountName}
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.budgetAmount} currency="USD" />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.actualAmount} currency="USD" />
              </TableCell>
              <TableCell className={cn('text-right font-medium', varianceColor(row.variancePct))}>
                <MoneyCell amount={row.variance} currency="USD" />
              </TableCell>
              <TableCell className={cn('text-right font-medium', varianceColor(row.variancePct))}>
                {row.variancePct > 0 ? '+' : ''}
                {row.variancePct.toFixed(1)}%
              </TableCell>
            </DrilldownRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-bold">
              <MoneyCell amount={totalBudget} currency="USD" />
            </TableCell>
            <TableCell className="text-right font-bold">
              <MoneyCell amount={totalActual} currency="USD" />
            </TableCell>
            <TableCell className="text-right font-bold">
              <MoneyCell amount={totalVariance} currency="USD" />
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

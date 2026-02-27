'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoneyCell } from '@/components/erp/money-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WhtReportSummary } from '../queries/ap-wht.queries';

interface ApWhtSummaryProps {
  summary: WhtReportSummary;
}

export function ApWhtSummary({ summary }: ApWhtSummaryProps) {
  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{summary.certificateCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyCell amount={summary.totalGross} currency={summary.currencyCode} showCode />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total WHT</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyCell amount={summary.totalWht} currency={summary.currencyCode} showCode />
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by income type */}
      {summary.byIncomeType.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <caption className="sr-only">WHT breakdown by income type</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Income Type</TableHead>
                <TableHead className="text-right">Certificates</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">WHT Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.byIncomeType.map((row) => (
                <TableRow key={row.incomeType}>
                  <TableCell className="font-medium">{row.incomeType.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.grossAmount} currency={summary.currencyCode} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.whtAmount} currency={summary.currencyCode} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

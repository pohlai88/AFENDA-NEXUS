'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { MoneyCell } from '@/components/erp/money-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { Banknote, Plus } from 'lucide-react';
import type { PaymentRunListItem } from '../queries/ap-payment-run.queries';

interface ApPaymentRunTableProps {
  data: PaymentRunListItem[];
}

export function ApPaymentRunTable({ data }: ApPaymentRunTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="finance.payables.paymentRuns"
        constraint="table"
        icon={Banknote}
        action={
          <Button asChild>
            <Link href={routes.finance.paymentRunNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Payment Run
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Payment runs — {data.length} runs</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Run #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Run Date</TableHead>
            <TableHead>Cutoff Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((run) => {
            const href = routes.finance.paymentRunDetail(run.id);
            return (
              <TableRow
                key={run.id}
                className="cursor-pointer"
                tabIndex={0}
                role="link"
                aria-label={`Open payment run ${run.runNumber}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = href;
                  }
                }}
              >
                <TableCell>
                  <Link
                    href={href}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {run.runNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={run.status} />
                </TableCell>
                <TableCell>
                  <DateCell date={run.runDate} format="short" />
                </TableCell>
                <TableCell>
                  <DateCell date={run.cutoffDate} format="short" />
                </TableCell>
                <TableCell className="tabular-nums">{run.itemCount}</TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={run.totalAmount} currency={run.currencyCode} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

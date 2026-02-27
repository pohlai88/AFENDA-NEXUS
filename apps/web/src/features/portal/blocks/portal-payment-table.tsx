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
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { routes } from '@/lib/constants';
import { Banknote } from 'lucide-react';
import type { PortalPaymentRunListItem } from '../queries/portal.queries';

interface PortalPaymentTableProps {
  data: PortalPaymentRunListItem[];
  total: number;
}

export function PortalPaymentTable({ data, total }: PortalPaymentTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="portal.payments"
        icon={Banknote}
      />
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Payment runs — {total} runs</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Run #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((run) => {
              const detailHref = routes.portal.paymentDetail(run.id);
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
                      window.location.href = detailHref;
                    }
                  }}
                  onClick={() => { window.location.href = detailHref; }}
                >
                  <TableCell>
                    <Link
                      href={detailHref}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                      tabIndex={-1}
                    >
                      {run.runNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DateCell date={run.runDate} format="short" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{run.invoiceCount}</TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={run.totalAmount} currency={run.currencyCode} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} payment run{total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}

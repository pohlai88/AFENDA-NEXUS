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
import { DueDateCell } from '@/components/erp/due-date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { routes } from '@/lib/constants';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortalInvoiceListItem } from '../queries/portal.queries';

interface PortalInvoiceTableProps {
  data: PortalInvoiceListItem[];
  total: number;
}

export function PortalInvoiceTable({ data, total }: PortalInvoiceTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="portal.invoices"
        constraint="table"
        icon={Receipt}
        action={
          <Button asChild>
            <Link href={routes.portal.invoiceSubmit}>Submit Invoice</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Supplier invoices — {total} invoices</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invoice) => {
              const detailHref = routes.portal.invoiceDetail(invoice.id);
              return (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  role="link"
                  aria-label={`Open invoice ${invoice.invoiceNumber}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.location.href = detailHref;
                    }
                  }}
                  onClick={() => {
                    window.location.href = detailHref;
                  }}
                >
                  <TableCell>
                    <Link
                      href={detailHref}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                      tabIndex={-1}
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DateCell date={invoice.invoiceDate} format="short" />
                  </TableCell>
                  <TableCell>
                    <DueDateCell dueDate={invoice.dueDate} status={invoice.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={invoice.totalAmount} currency={invoice.currencyCode} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={invoice.amountPaid} currency={invoice.currencyCode} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={invoice.balanceDue} currency={invoice.currencyCode} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} invoice{total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}

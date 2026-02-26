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
        title="No invoices found"
        description="Submit your first invoice to get started."
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
            {data.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={routes.portal.invoiceDetail(invoice.id)}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <DateCell date={invoice.invoiceDate} format="short" />
                </TableCell>
                <TableCell>
                  <DateCell date={invoice.dueDate} format="short" />
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
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} invoice{total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}

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
import type { ApInvoiceListItem } from '../queries/ap.queries';

interface ApInvoiceTableProps {
  data: ApInvoiceListItem[];
  total: number;
}

export function ApInvoiceTable({ data, total }: ApInvoiceTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No payable invoices found"
        description="Create your first AP invoice to get started."
        icon={Receipt}
        action={
          <Button asChild>
            <Link href={routes.finance.payableNew}>Create Invoice</Link>
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
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={routes.finance.payableDetail(invoice.id)}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{invoice.supplierName}</TableCell>
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

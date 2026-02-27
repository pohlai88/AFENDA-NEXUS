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
import { MoneyCell } from '@/components/erp/money-cell';
import { DueDateCell } from '@/components/erp/due-date-cell';
import { routes } from '@/lib/constants';
import type { PaymentRunItemView } from '../queries/ap-payment-run.queries';

interface ApPaymentRunItemsTableProps {
  items: PaymentRunItemView[];
  currencyCode: string;
}

export function ApPaymentRunItemsTable({ items, currencyCode }: ApPaymentRunItemsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Payment run items — {items.length} invoices</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              tabIndex={0}
              role="link"
              aria-label={`Open invoice ${item.invoiceNumber}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = routes.finance.payableDetail(item.invoiceId);
                }
              }}
            >
              <TableCell>
                <Link
                  href={routes.finance.payableDetail(item.invoiceId)}
                  className="font-mono text-sm font-medium text-primary hover:underline"
                >
                  {item.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.supplierName}</TableCell>
              <TableCell>
                <DueDateCell dueDate={item.dueDate} status="APPROVED" />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={item.amount} currency={currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={item.discountAmount} currency={currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={item.netAmount} currency={currencyCode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

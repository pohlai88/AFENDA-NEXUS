'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { MoneyCell } from '@/components/erp/money-cell';
import type { PortalInvoiceLine } from '../queries/portal.queries';

interface PortalInvoiceLinesTableProps {
  lines: PortalInvoiceLine[];
  currencyCode: string;
  totalAmount: string;
}

export function PortalInvoiceLinesTable({
  lines,
  currencyCode,
  totalAmount,
}: PortalInvoiceLinesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="text-muted-foreground">{line.lineNumber}</TableCell>
              <TableCell>{line.description}</TableCell>
              <TableCell className="text-right font-mono text-sm">{line.quantity}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.unitPrice} currency={currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.taxAmount} currency={currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.amount} currency={currencyCode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={totalAmount} currency={currencyCode} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

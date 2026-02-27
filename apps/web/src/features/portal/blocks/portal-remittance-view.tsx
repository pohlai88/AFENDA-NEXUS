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
import type { PortalRemittanceAdvice } from '../queries/portal.queries';

interface PortalRemittanceViewProps {
  remittance: PortalRemittanceAdvice;
}

export function PortalRemittanceView({ remittance }: PortalRemittanceViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Run Number</p>
          <p className="text-sm font-medium">{remittance.runNumber}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Run Date</p>
          <p className="text-sm">{remittance.runDate}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Supplier</p>
          <p className="text-sm">{remittance.supplierName}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Net Amount</p>
          <MoneyCell amount={remittance.totalNet} currency={remittance.currencyCode} showCode />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Remittance advice — {remittance.items.length} invoices</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead className="text-right">Gross Amount</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Net Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remittance.items.map((item) => (
              <TableRow key={item.invoiceId}>
                <TableCell className="font-mono text-sm">{item.invoiceNumber}</TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={item.grossAmount} currency={remittance.currencyCode} />
                </TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={item.discountAmount} currency={remittance.currencyCode} />
                </TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={item.netAmount} currency={remittance.currencyCode} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Totals</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={remittance.totalGross} currency={remittance.currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={remittance.totalDiscount} currency={remittance.currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={remittance.totalNet} currency={remittance.currencyCode} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

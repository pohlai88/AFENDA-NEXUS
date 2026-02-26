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
import type { ApInvoiceLineView } from '../queries/ap.queries';

interface ApInvoiceLinesTableProps {
  lines: ApInvoiceLineView[];
  currency: string;
  totalAmount: string;
  totalTax: string;
}

export function ApInvoiceLinesTable({
  lines,
  currency,
  totalAmount,
  totalTax,
}: ApInvoiceLinesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Tax</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-mono text-sm">
                {line.accountCode}
                {line.accountName && (
                  <span className="ml-2 text-muted-foreground">{line.accountName}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{line.description ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.unitPrice} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.amount} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.taxAmount} currency={currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-medium">
            <TableCell colSpan={4} className="text-right text-xs text-muted-foreground">
              Totals
            </TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={totalAmount} currency={currency} />
            </TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={totalTax} currency={currency} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

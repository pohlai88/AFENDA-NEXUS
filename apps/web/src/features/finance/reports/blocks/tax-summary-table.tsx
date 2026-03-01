import { MoneyCell } from '@/components/erp/money-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TaxSummaryRow {
  taxCode: string;
  taxName: string;
  taxableBase: string;
  taxAmount: string;
  adjustments: string;
  netTax: string;
}

interface TaxSummaryData {
  rows: TaxSummaryRow[];
  totalTaxableBase: string;
  totalTaxAmount: string;
  totalAdjustments: string;
  totalNetTax: string;
}

export function TaxSummaryTable({ data }: { data: TaxSummaryData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Tax summary report</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Tax Code</TableHead>
            <TableHead>Tax Name</TableHead>
            <TableHead className="text-right w-[130px]">Taxable Base</TableHead>
            <TableHead className="text-right w-[130px]">Tax Amount</TableHead>
            <TableHead className="text-right w-[130px]">Adjustments</TableHead>
            <TableHead className="text-right w-[130px]">Net Tax</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-12 text-center text-muted-foreground">
                No tax data found.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <TableRow key={row.taxCode}>
                <TableCell className="font-mono text-sm">{row.taxCode}</TableCell>
                <TableCell>{row.taxName}</TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.taxableBase} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.taxAmount} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.adjustments} /></TableCell>
                <TableCell className="text-right font-semibold"><MoneyCell amount={row.netTax} /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalTaxableBase} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalTaxAmount} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalAdjustments} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalNetTax} /></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

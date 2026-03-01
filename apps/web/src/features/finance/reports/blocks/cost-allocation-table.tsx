import { MoneyCell } from '@/components/erp/money-cell';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CostAllocationRow {
  costCenterCode: string;
  costCenterName: string;
  directCosts: string;
  allocatedCosts: string;
  totalCosts: string;
  allocationPercent: number;
}

interface CostAllocationData {
  rows: CostAllocationRow[];
  totalDirectCosts: string;
  totalAllocatedCosts: string;
  grandTotal: string;
}

export function CostAllocationTable({ data }: { data: CostAllocationData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Cost allocation report</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Cost Centre</TableHead>
            <TableHead className="text-right w-[130px]">Direct Costs</TableHead>
            <TableHead className="text-right w-[130px]">Allocated Costs</TableHead>
            <TableHead className="text-right w-[130px]">Total</TableHead>
            <TableHead className="text-right w-[100px]">Allocation %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-12 text-center text-muted-foreground">
                No cost centres found.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <TableRow key={row.costCenterCode}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{row.costCenterCode}</Badge>
                    <span>{row.costCenterName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.directCosts} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.allocatedCosts} /></TableCell>
                <TableCell className="text-right font-semibold"><MoneyCell amount={row.totalCosts} /></TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.allocationPercent.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell>Grand Total</TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalDirectCosts} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalAllocatedCosts} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.grandTotal} /></TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

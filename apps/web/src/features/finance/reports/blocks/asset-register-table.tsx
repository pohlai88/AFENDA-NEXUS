'use client';

import { MoneyCell } from '@/components/erp/money-cell';
import { DrilldownRow } from '@/components/erp/drilldown';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AssetRegisterRow {
  assetId: string;
  assetCode: string;
  description: string;
  category: string;
  acquisitionDate: string;
  costAmount: string;
  accumulatedDepreciation: string;
  netBookValue: string;
  status: string;
}

interface AssetRegisterData {
  rows: AssetRegisterRow[];
  totalCost: string;
  totalDepreciation: string;
  totalNBV: string;
}

export function AssetRegisterTable({ data }: { data: AssetRegisterData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Fixed asset register</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Asset Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-[100px]">Acquired</TableHead>
            <TableHead className="text-right w-[120px]">Cost</TableHead>
            <TableHead className="text-right w-[120px]">Accum. Depr.</TableHead>
            <TableHead className="text-right w-[120px]">NBV</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-12 text-center text-muted-foreground">
                No fixed assets found.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <DrilldownRow key={row.assetCode} href={routes.finance.fixedAssetDetail(row.assetId)}>
                <TableCell className="font-mono text-xs">{row.assetCode}</TableCell>
                <TableCell className="max-w-[250px] truncate">{row.description}</TableCell>
                <TableCell><Badge variant="secondary">{row.category}</Badge></TableCell>
                <TableCell className="text-xs">{row.acquisitionDate}</TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.costAmount} /></TableCell>
                <TableCell className="text-right text-muted-foreground"><MoneyCell amount={row.accumulatedDepreciation} /></TableCell>
                <TableCell className="text-right font-semibold"><MoneyCell amount={row.netBookValue} /></TableCell>
                <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
              </DrilldownRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalCost} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalDepreciation} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalNBV} /></TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

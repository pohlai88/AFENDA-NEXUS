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

interface ConsolidationRow {
  entityCode: string;
  entityName: string;
  currency: string;
  ownershipPercent: number;
  method: string;
  assets: string;
  liabilities: string;
  equity: string;
}

interface ConsolidationData {
  rows: ConsolidationRow[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  eliminationsTotal: string;
}

export function ConsolidationReportTable({ data }: { data: ConsolidationData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Group consolidation report</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead className="w-[80px]">Currency</TableHead>
            <TableHead className="text-right w-[100px]">Ownership %</TableHead>
            <TableHead className="w-[100px]">Method</TableHead>
            <TableHead className="text-right w-[130px]">Assets</TableHead>
            <TableHead className="text-right w-[130px]">Liabilities</TableHead>
            <TableHead className="text-right w-[130px]">Equity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-12 text-center text-muted-foreground">
                No entities found for consolidation.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <TableRow key={row.entityCode}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{row.entityCode}</Badge>
                    <span>{row.entityName}</span>
                  </div>
                </TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell className="text-right">{row.ownershipPercent}%</TableCell>
                <TableCell><Badge variant="secondary">{row.method}</Badge></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.assets} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.liabilities} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.equity} /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={4}>Consolidated Total</TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalAssets} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalLiabilities} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totalEquity} /></TableCell>
          </TableRow>
          {data.eliminationsTotal !== '0' && (
            <TableRow className="text-muted-foreground">
              <TableCell colSpan={4}>Eliminations</TableCell>
              <TableCell colSpan={3} className="text-right">
                <MoneyCell amount={data.eliminationsTotal} />
              </TableCell>
            </TableRow>
          )}
        </TableFooter>
      </Table>
    </div>
  );
}

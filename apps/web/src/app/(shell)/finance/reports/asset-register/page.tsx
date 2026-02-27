import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReportWrapper, DrilldownRow } from '@/components/erp/report-wrapper';
import { formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';

interface AssetRegisterItem {
  assetNumber: string;
  assetId: string;
  description: string;
  category: string;
  location: string;
  acquisitionDate: Date;
  originalCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: string;
}

async function getAssetRegisterData(): Promise<{
  assets: AssetRegisterItem[];
  totals: { originalCost: number; accumulatedDepreciation: number; netBookValue: number };
  currency: string;
}> {
  await new Promise((r) => setTimeout(r, 400));
  const assets: AssetRegisterItem[] = [
    {
      assetNumber: 'FA-2022-001',
      assetId: 'asset-1',
      description: 'Manufacturing Equipment - Line A',
      category: 'Machinery',
      location: 'Plant 1',
      acquisitionDate: new Date('2022-03-15'),
      originalCost: 450000,
      accumulatedDepreciation: 135000,
      netBookValue: 315000,
      status: 'active',
    },
    {
      assetNumber: 'FA-2023-001',
      assetId: 'asset-2',
      description: 'Office Building',
      category: 'Buildings',
      location: 'HQ',
      acquisitionDate: new Date('2023-01-01'),
      originalCost: 2500000,
      accumulatedDepreciation: 125000,
      netBookValue: 2375000,
      status: 'active',
    },
    {
      assetNumber: 'FA-2024-001',
      assetId: 'asset-3',
      description: 'Delivery Vehicles (Fleet)',
      category: 'Vehicles',
      location: 'Distribution Center',
      acquisitionDate: new Date('2024-06-01'),
      originalCost: 350000,
      accumulatedDepreciation: 87500,
      netBookValue: 262500,
      status: 'active',
    },
    {
      assetNumber: 'FA-2024-002',
      assetId: 'asset-4',
      description: 'Server Infrastructure',
      category: 'IT Equipment',
      location: 'Data Center',
      acquisitionDate: new Date('2024-09-15'),
      originalCost: 180000,
      accumulatedDepreciation: 30000,
      netBookValue: 150000,
      status: 'active',
    },
  ];
  const totals = assets.reduce(
    (acc, a) => ({
      originalCost: acc.originalCost + a.originalCost,
      accumulatedDepreciation: acc.accumulatedDepreciation + a.accumulatedDepreciation,
      netBookValue: acc.netBookValue + a.netBookValue,
    }),
    { originalCost: 0, accumulatedDepreciation: 0, netBookValue: 0 }
  );
  return { assets, totals, currency: 'USD' };
}

async function AssetRegisterTable() {
  const data = await getAssetRegisterData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed Asset Register</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Asset register</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Asset #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Acquisition</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Accum. Depr.</TableHead>
              <TableHead className="text-right">NBV</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" aria-hidden />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.assets.map((a) => (
              <DrilldownRow key={a.assetId} href={routes.finance.fixedAssetDetail(a.assetId)}>
                <TableCell className="font-mono">{a.assetNumber}</TableCell>
                <TableCell className="max-w-[200px] truncate">{a.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{a.category}</Badge>
                </TableCell>
                <TableCell>{a.location}</TableCell>
                <TableCell>{formatDate(a.acquisitionDate)}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(a.originalCost, data.currency)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(a.accumulatedDepreciation, data.currency)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(a.netBookValue, data.currency)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </TableCell>
              </DrilldownRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.originalCost, data.currency)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.accumulatedDepreciation, data.currency)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.netBookValue, data.currency)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AssetRegisterPage() {
  return (
    <ReportWrapper
      title="Fixed Asset Register"
      description="Complete list of fixed assets with depreciation"
      reportId="asset-register"
    >
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <AssetRegisterTable />
      </Suspense>
    </ReportWrapper>
  );
}

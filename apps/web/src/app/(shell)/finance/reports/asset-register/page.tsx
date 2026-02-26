import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportWrapper, DrilldownRow } from '@/components/erp/report-wrapper';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AssetRegisterItem { assetNumber: string; assetId: string; description: string; category: string; location: string; acquisitionDate: Date; originalCost: number; accumulatedDepreciation: number; netBookValue: number; status: string; }

async function getAssetRegisterData(): Promise<{ assets: AssetRegisterItem[]; totals: { originalCost: number; accumulatedDepreciation: number; netBookValue: number }; currency: string }> {
  await new Promise((r) => setTimeout(r, 400));
  const assets: AssetRegisterItem[] = [
    { assetNumber: 'FA-2022-001', assetId: 'asset-1', description: 'Manufacturing Equipment - Line A', category: 'Machinery', location: 'Plant 1', acquisitionDate: new Date('2022-03-15'), originalCost: 450000, accumulatedDepreciation: 135000, netBookValue: 315000, status: 'active' },
    { assetNumber: 'FA-2023-001', assetId: 'asset-2', description: 'Office Building', category: 'Buildings', location: 'HQ', acquisitionDate: new Date('2023-01-01'), originalCost: 2500000, accumulatedDepreciation: 125000, netBookValue: 2375000, status: 'active' },
    { assetNumber: 'FA-2024-001', assetId: 'asset-3', description: 'Delivery Vehicles (Fleet)', category: 'Vehicles', location: 'Distribution Center', acquisitionDate: new Date('2024-06-01'), originalCost: 350000, accumulatedDepreciation: 87500, netBookValue: 262500, status: 'active' },
    { assetNumber: 'FA-2024-002', assetId: 'asset-4', description: 'Server Infrastructure', category: 'IT Equipment', location: 'Data Center', acquisitionDate: new Date('2024-09-15'), originalCost: 180000, accumulatedDepreciation: 30000, netBookValue: 150000, status: 'active' },
  ];
  const totals = assets.reduce((acc, a) => ({ originalCost: acc.originalCost + a.originalCost, accumulatedDepreciation: acc.accumulatedDepreciation + a.accumulatedDepreciation, netBookValue: acc.netBookValue + a.netBookValue }), { originalCost: 0, accumulatedDepreciation: 0, netBookValue: 0 });
  return { assets, totals, currency: 'USD' };
}

async function AssetRegisterTable() {
  const data = await getAssetRegisterData();

  return (
    <Card>
      <CardHeader><CardTitle>Fixed Asset Register</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Asset #</th>
                <th className="text-left py-3 px-2 font-semibold">Description</th>
                <th className="text-left py-3 px-2 font-semibold">Category</th>
                <th className="text-left py-3 px-2 font-semibold">Location</th>
                <th className="text-left py-3 px-2 font-semibold">Acquisition</th>
                <th className="text-right py-3 px-2 font-semibold">Cost</th>
                <th className="text-right py-3 px-2 font-semibold">Accum. Depr.</th>
                <th className="text-right py-3 px-2 font-semibold">NBV</th>
                <th className="py-3 px-2 font-semibold">Status</th>
                <th className="w-8" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {data.assets.map((a) => (
                <DrilldownRow key={a.assetId} href={`/finance/fixed-assets/${a.assetId}`}>
                  <td className="py-3 px-2 font-mono">{a.assetNumber}</td>
                  <td className="py-3 px-2 max-w-[200px] truncate">{a.description}</td>
                  <td className="py-3 px-2"><Badge variant="secondary">{a.category}</Badge></td>
                  <td className="py-3 px-2">{a.location}</td>
                  <td className="py-3 px-2">{formatDate(a.acquisitionDate)}</td>
                  <td className="text-right py-3 px-2 font-mono">{formatCurrency(a.originalCost, data.currency)}</td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">{formatCurrency(a.accumulatedDepreciation, data.currency)}</td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">{formatCurrency(a.netBookValue, data.currency)}</td>
                  <td className="py-3 px-2"><Badge className="bg-green-100 text-green-800">Active</Badge></td>
                </DrilldownRow>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/50">
                <td colSpan={5} className="py-3 px-2">Total</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.originalCost, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.accumulatedDepreciation, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.netBookValue, data.currency)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssetRegisterPage() {
  return (
    <ReportWrapper title="Fixed Asset Register" description="Complete list of fixed assets with depreciation" reportId="asset-register">
      <Suspense fallback={<Skeleton className="h-[400px]" />}><AssetRegisterTable /></Suspense>
    </ReportWrapper>
  );
}

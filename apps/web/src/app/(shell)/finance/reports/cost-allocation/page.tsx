import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportWrapper, DrilldownRow } from '@/components/erp/report-wrapper';
import { ReportPeriodPicker } from '@/components/erp/report-period-picker';
import { formatCurrency } from '@/lib/utils';

interface CostAllocationItem {
  costCenterCode: string;
  costCenterId: string;
  costCenterName: string;
  directCosts: number;
  allocatedIn: number;
  allocatedOut: number;
  totalCost: number;
}

async function getCostAllocationData(): Promise<{ items: CostAllocationItem[]; totals: { directCosts: number; allocatedIn: number; allocatedOut: number; totalCost: number }; currency: string }> {
  await new Promise((r) => setTimeout(r, 400));
  const items: CostAllocationItem[] = [
    { costCenterCode: 'PROD', costCenterId: 'cc-prod', costCenterName: 'Production', directCosts: 2500000, allocatedIn: 350000, allocatedOut: 0, totalCost: 2850000 },
    { costCenterCode: 'SALES', costCenterId: 'cc-sales', costCenterName: 'Sales & Marketing', directCosts: 1200000, allocatedIn: 180000, allocatedOut: 0, totalCost: 1380000 },
    { costCenterCode: 'ADMIN', costCenterId: 'cc-admin', costCenterName: 'Administration', directCosts: 800000, allocatedIn: 0, allocatedOut: -350000, totalCost: 450000 },
    { costCenterCode: 'IT', costCenterId: 'cc-it', costCenterName: 'IT Services', directCosts: 450000, allocatedIn: 0, allocatedOut: -180000, totalCost: 270000 },
    { costCenterCode: 'CORP', costCenterId: 'cc-corp', costCenterName: 'Corporate', directCosts: 650000, allocatedIn: 0, allocatedOut: 0, totalCost: 650000 },
  ];
  const totals = items.reduce((acc, i) => ({
    directCosts: acc.directCosts + i.directCosts,
    allocatedIn: acc.allocatedIn + i.allocatedIn,
    allocatedOut: acc.allocatedOut + i.allocatedOut,
    totalCost: acc.totalCost + i.totalCost,
  }), { directCosts: 0, allocatedIn: 0, allocatedOut: 0, totalCost: 0 });
  return { items, totals, currency: 'USD' };
}

async function CostAllocationTable() {
  const data = await getCostAllocationData();

  return (
    <Card>
      <CardHeader><CardTitle>Cost Allocation Summary</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Cost Center</th>
                <th className="text-right py-3 px-2 font-semibold">Direct Costs</th>
                <th className="text-right py-3 px-2 font-semibold">Allocated In</th>
                <th className="text-right py-3 px-2 font-semibold">Allocated Out</th>
                <th className="text-right py-3 px-2 font-semibold">Total Cost</th>
                <th className="w-8" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <DrilldownRow key={item.costCenterId} href={`/finance/cost-centers/${item.costCenterId}`}>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{item.costCenterCode}</Badge>
                      <span>{item.costCenterName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono">{formatCurrency(item.directCosts, data.currency)}</td>
                  <td className="text-right py-3 px-2 font-mono text-green-600">{item.allocatedIn > 0 ? formatCurrency(item.allocatedIn, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono text-red-600">{item.allocatedOut < 0 ? formatCurrency(item.allocatedOut, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">{formatCurrency(item.totalCost, data.currency)}</td>
                </DrilldownRow>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/50">
                <td className="py-3 px-2">Total</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.directCosts, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.allocatedIn, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.allocatedOut, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.totalCost, data.currency)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CostAllocationPage() {
  return (
    <ReportWrapper title="Cost Allocation Report" description="Cost center allocations for the period" reportId="cost-allocation">
      <div className="space-y-6">
        <ReportPeriodPicker mode="period" />
        <Suspense fallback={<Skeleton className="h-[400px]" />}><CostAllocationTable /></Suspense>
      </div>
    </ReportWrapper>
  );
}

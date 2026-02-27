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
import { ReportPeriodPicker } from '@/components/erp/report-period-picker';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';

interface CostAllocationItem {
  costCenterCode: string;
  costCenterId: string;
  costCenterName: string;
  directCosts: number;
  allocatedIn: number;
  allocatedOut: number;
  totalCost: number;
}

async function getCostAllocationData(): Promise<{
  items: CostAllocationItem[];
  totals: { directCosts: number; allocatedIn: number; allocatedOut: number; totalCost: number };
  currency: string;
}> {
  await new Promise((r) => setTimeout(r, 400));
  const items: CostAllocationItem[] = [
    {
      costCenterCode: 'PROD',
      costCenterId: 'cc-prod',
      costCenterName: 'Production',
      directCosts: 2500000,
      allocatedIn: 350000,
      allocatedOut: 0,
      totalCost: 2850000,
    },
    {
      costCenterCode: 'SALES',
      costCenterId: 'cc-sales',
      costCenterName: 'Sales & Marketing',
      directCosts: 1200000,
      allocatedIn: 180000,
      allocatedOut: 0,
      totalCost: 1380000,
    },
    {
      costCenterCode: 'ADMIN',
      costCenterId: 'cc-admin',
      costCenterName: 'Administration',
      directCosts: 800000,
      allocatedIn: 0,
      allocatedOut: -350000,
      totalCost: 450000,
    },
    {
      costCenterCode: 'IT',
      costCenterId: 'cc-it',
      costCenterName: 'IT Services',
      directCosts: 450000,
      allocatedIn: 0,
      allocatedOut: -180000,
      totalCost: 270000,
    },
    {
      costCenterCode: 'CORP',
      costCenterId: 'cc-corp',
      costCenterName: 'Corporate',
      directCosts: 650000,
      allocatedIn: 0,
      allocatedOut: 0,
      totalCost: 650000,
    },
  ];
  const totals = items.reduce(
    (acc, i) => ({
      directCosts: acc.directCosts + i.directCosts,
      allocatedIn: acc.allocatedIn + i.allocatedIn,
      allocatedOut: acc.allocatedOut + i.allocatedOut,
      totalCost: acc.totalCost + i.totalCost,
    }),
    { directCosts: 0, allocatedIn: 0, allocatedOut: 0, totalCost: 0 }
  );
  return { items, totals, currency: 'USD' };
}

async function CostAllocationTable() {
  const data = await getCostAllocationData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Allocation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Cost allocation report</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Cost Center</TableHead>
              <TableHead className="text-right">Direct Costs</TableHead>
              <TableHead className="text-right">Allocated In</TableHead>
              <TableHead className="text-right">Allocated Out</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="w-8" aria-hidden />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <DrilldownRow
                key={item.costCenterId}
                href={routes.finance.costCenterDetail(item.costCenterId)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {item.costCenterCode}
                    </Badge>
                    <span>{item.costCenterName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.directCosts, data.currency)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {item.allocatedIn > 0 ? formatCurrency(item.allocatedIn, data.currency) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {item.allocatedOut < 0 ? formatCurrency(item.allocatedOut, data.currency) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(item.totalCost, data.currency)}
                </TableCell>
              </DrilldownRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.directCosts, data.currency)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.allocatedIn, data.currency)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.allocatedOut, data.currency)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.totals.totalCost, data.currency)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function CostAllocationPage() {
  return (
    <ReportWrapper
      title="Cost Allocation Report"
      description="Cost center allocations for the period"
      reportId="cost-allocation"
    >
      <div className="space-y-6">
        <ReportPeriodPicker mode="period" />
        <Suspense fallback={<Skeleton className="h-[400px]" />}>
          <CostAllocationTable />
        </Suspense>
      </div>
    </ReportWrapper>
  );
}

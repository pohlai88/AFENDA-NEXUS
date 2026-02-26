import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Plus, Calculator, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import {
  getDeferredTaxItems,
  getDeferredTaxSummary,
} from '@/features/finance/deferred-tax/queries/deferred-tax.queries';
import { formatCurrency } from '@/lib/utils';
import {
  deferredTaxTypeLabels,
  originTypeLabels,
  itemStatusConfig,
} from '@/features/finance/deferred-tax/types';
import type { DeferredTaxItem } from '@/features/finance/deferred-tax/types';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getDeferredTaxSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  const isNetAsset = s.netPosition >= 0;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total DTA</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(s.totalDTA, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total DTL</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(s.totalDTL, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Net Position</CardTitle>
          <Scale className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isNetAsset ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(s.netPosition), 'USD')}
          </div>
          <p className="text-xs text-muted-foreground">
            {isNetAsset ? 'Net Deferred Tax Asset' : 'Net Deferred Tax Liability'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Valuation Allowance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(s.valuationAllowance, 'USD')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ItemsSection() {
  const result = await getDeferredTaxItems({ status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const columns: Column<DeferredTaxItem>[] = [
    {
      key: 'itemNumber',
      header: 'Item #',
      sortable: true,
      render: (i) => <span className="font-mono">{i.itemNumber}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (i) => <div className="max-w-[200px] truncate">{i.description}</div>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (i) => (
        <Badge variant={i.type === 'dta' ? 'default' : 'destructive'}>
          {i.type === 'dta' ? 'DTA' : 'DTL'}
        </Badge>
      ),
    },
    {
      key: 'originType',
      header: 'Origin',
      render: (i) => <Badge variant="secondary">{originTypeLabels[i.originType]}</Badge>,
    },
    {
      key: 'temporaryDifference',
      header: 'Temp. Diff.',
      align: 'right',
      render: (i) => (
        <span className="font-mono">{formatCurrency(i.temporaryDifference, i.currency)}</span>
      ),
    },
    {
      key: 'taxRate',
      header: 'Rate',
      align: 'right',
      render: (i) => <span className="font-mono">{i.taxRate}%</span>,
    },
    {
      key: 'deferredTaxAmount',
      header: 'DT Amount',
      align: 'right',
      render: (i) => (
        <span
          className={`font-mono ${i.deferredTaxAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatCurrency(i.deferredTaxAmount, i.currency)}
        </span>
      ),
    },
    { key: 'jurisdiction', header: 'Jurisdiction', render: (i) => <span>{i.jurisdiction}</span> },
  ];
  return (
    <DataTable
      data={result.data}
      columns={columns}
      searchPlaceholder="Search items..."
      searchKeys={['itemNumber', 'description']}
    />
  );
}

export default function DeferredTaxPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Deferred Tax (IAS 12)
          </h1>
          <p className="text-muted-foreground">Deferred tax assets, liabilities, and movements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.finance.deferredTaxRecalculate}>
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate
            </Link>
          </Button>
          <Button asChild>
            <Link href={routes.finance.deferredTaxNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Link>
          </Button>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Items</h2>
      <Suspense fallback={<Skeleton className="h-[350px]" />}>
        <ItemsSection />
      </Suspense>
    </div>
  );
}

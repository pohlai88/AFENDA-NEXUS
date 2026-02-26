import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ReportWrapper, DrilldownRow } from '@/components/erp/report-wrapper';
import { formatCurrency } from '@/lib/utils';

interface APAgingBucket { vendor: string; vendorId: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number; }

async function getAPAgingData(): Promise<{ buckets: APAgingBucket[]; totals: Omit<APAgingBucket, 'vendor' | 'vendorId'>; currency: string }> {
  await new Promise((r) => setTimeout(r, 400));
  const buckets: APAgingBucket[] = [
    { vendor: 'Supplier Co. Ltd', vendorId: 'vend-1', current: 85000, days30: 35000, days60: 0, days90: 0, over90: 0, total: 120000 },
    { vendor: 'Parts International', vendorId: 'vend-2', current: 125000, days30: 45000, days60: 25000, days90: 0, over90: 0, total: 195000 },
    { vendor: 'Office Services Inc', vendorId: 'vend-3', current: 15000, days30: 8000, days60: 0, days90: 0, over90: 0, total: 23000 },
    { vendor: 'Logistics Partners', vendorId: 'vend-4', current: 45000, days30: 0, days60: 0, days90: 0, over90: 0, total: 45000 },
  ];
  const totals = buckets.reduce((acc, b) => ({
    current: acc.current + b.current, days30: acc.days30 + b.days30, days60: acc.days60 + b.days60, days90: acc.days90 + b.days90, over90: acc.over90 + b.over90, total: acc.total + b.total,
  }), { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 });
  return { buckets, totals, currency: 'USD' };
}

async function APAgingTable() {
  const data = await getAPAgingData();
  const grandTotal = data.totals.total;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Accounts Payable Aging</span>
          <div className="flex gap-4 text-sm font-normal">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" />Current</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" />1-30 Days</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" />31-60 Days</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" />61-90 Days</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" />&gt;90 Days</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Vendor</th>
                <th className="text-right py-3 px-2 font-semibold">Current</th>
                <th className="text-right py-3 px-2 font-semibold">1-30 Days</th>
                <th className="text-right py-3 px-2 font-semibold">31-60 Days</th>
                <th className="text-right py-3 px-2 font-semibold">61-90 Days</th>
                <th className="text-right py-3 px-2 font-semibold">&gt;90 Days</th>
                <th className="text-right py-3 px-2 font-semibold">Total</th>
                <th className="py-3 px-2 font-semibold w-[150px]">% of Total</th>
                <th className="w-8" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {data.buckets.map((b) => (
                <DrilldownRow key={b.vendorId} href={`/purchasing/vendors/${b.vendorId}`}>
                  <td className="py-3 px-2">{b.vendor}</td>
                  <td className="text-right py-3 px-2 font-mono text-green-600">{b.current > 0 ? formatCurrency(b.current, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono text-blue-600">{b.days30 > 0 ? formatCurrency(b.days30, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono text-amber-600">{b.days60 > 0 ? formatCurrency(b.days60, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono text-orange-600">{b.days90 > 0 ? formatCurrency(b.days90, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono text-red-600">{b.over90 > 0 ? formatCurrency(b.over90, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">{formatCurrency(b.total, data.currency)}</td>
                  <td className="py-3 px-2"><Progress value={(b.total / grandTotal) * 100} className="h-2" /></td>
                </DrilldownRow>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/50">
                <td className="py-3 px-2">Total</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.current, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.days30, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.days60, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.days90, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.over90, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(data.totals.total, data.currency)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function APAgingPage() {
  return (
    <ReportWrapper title="Accounts Payable Aging" description="Vendor balances by aging bucket" reportId="ap-aging">
      <Suspense fallback={<Skeleton className="h-[400px]" />}><APAgingTable /></Suspense>
    </ReportWrapper>
  );
}

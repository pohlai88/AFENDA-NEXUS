import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRequestContext } from '@/lib/auth';
import { getPaymentRun } from '@/features/finance/payables/queries/ap-payment-run.queries';
import { ApPaymentRunDetailHeader } from '@/features/finance/payables/blocks/ap-payment-run-detail-header';
import { ApPaymentRunItemsTable } from '@/features/finance/payables/blocks/ap-payment-run-items-table';
import { ApPaymentRunActions } from '@/features/finance/payables/blocks/ap-payment-run-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Payables — Payment Runs' };

export default async function PaymentRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getPaymentRun(ctx, id);
  if (!result.ok) notFound();
  const run = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon"><Link href={routes.finance.paymentRuns}><ArrowLeft className="h-4 w-4" /></Link></Button>
        <span className="text-sm text-muted-foreground">Payment Runs</span>
      </div>

      <ApPaymentRunDetailHeader run={run} />
      <ApPaymentRunActions runId={run.id} status={run.status} />

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({run.itemCount})</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          {run.items.length > 0 ? (
            <ApPaymentRunItemsTable items={run.items} currencyCode={run.currencyCode} />
          ) : (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No items added yet. Add invoices to this payment run.</CardContent></Card>
          )}
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment Run Report</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Total Gross</p><p className="font-medium tabular-nums">{run.totalAmount} {run.currencyCode}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Discount</p><p className="font-medium tabular-nums">{run.totalDiscount} {run.currencyCode}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Net</p><p className="font-medium tabular-nums">{run.totalNet} {run.currencyCode}</p></div>
                <div><p className="text-xs text-muted-foreground">Invoices</p><p className="font-medium tabular-nums">{run.itemCount}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </Suspense>
  );
}

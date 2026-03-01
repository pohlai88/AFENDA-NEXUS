import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRequestContext } from '@/lib/auth';
import { getRemittanceAdvice } from '@/features/finance/payables/queries/ap-payment-run.queries';
import { ApRemittanceView } from '@/features/finance/payables/blocks/ap-remittance-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Payables — Payment Runs — Remittance' };

export default async function PaymentRunRemittancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getRemittanceAdvice(ctx, id);

  if (!result.ok) notFound();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.paymentRunDetail(id)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Remittance Advice</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Remittance Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <ApRemittanceView remittance={result.value} />
        </CardContent>
      </Card>
    </div>
  </Suspense>
  );
}

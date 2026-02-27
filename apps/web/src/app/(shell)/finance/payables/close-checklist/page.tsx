import { Suspense } from 'react';
import Link from 'next/link';
import { getRequestContext } from '@/lib/auth';
import { getApCloseChecklist } from '@/features/finance/payables/queries/ap-close.queries';
import { ApCloseChecklistView } from '@/features/finance/payables/blocks/ap-close-checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export default async function CloseChecklistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const periodId = typeof params.periodId === 'string' ? params.periodId : undefined;

  const ctx = await getRequestContext();
  const result = await getApCloseChecklist(ctx, { periodId });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.payables}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Payables</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AP Close Checklist</CardTitle>
          <CardDescription>
            {result.ok
              ? `Period: ${result.value.periodName} — as of ${result.value.asOfDate}`
              : 'Review all items before closing the AP sub-ledger for the period.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSkeleton />}>
            {result.ok ? (
              <ApCloseChecklistView checklist={result.value} />
            ) : (
              <p className="py-8 text-center text-sm text-destructive">
                Failed to load close checklist: {result.error.message}
              </p>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

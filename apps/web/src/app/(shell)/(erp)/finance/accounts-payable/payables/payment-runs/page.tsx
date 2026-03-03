import { Suspense } from 'react';
import Link from 'next/link';
import type { RequestContext } from '@afenda/core';
import { getRequestContext } from '@/lib/auth';
import { getPaymentRuns } from '@/features/finance/payables/queries/ap-payment-run.queries';
import { ApPaymentRunTable } from '@/features/finance/payables/blocks/ap-payment-run-table';
import { Pagination } from '@/components/erp/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import { Plus } from 'lucide-react';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Payables — Payment Runs' };

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'APPROVED', 'EXECUTED', 'CANCELLED'] as const;
const PAGE_SIZE = 20;

async function PaymentRunsContent({
  ctx,
  status,
  page,
}: {
  ctx: RequestContext;
  status?: string;
  page: string;
}) {
  const result = await getPaymentRuns(ctx, {
    status: status === 'ALL' ? undefined : status,
    page,
    limit: String(PAGE_SIZE),
  });
  const runs = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

  function buildHref(nextPage: number) {
    const sp = new URLSearchParams();
    if (status && status !== 'ALL') sp.set('status', status);
    sp.set('page', String(nextPage));
    return `${routes.finance.paymentRuns}?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Runs</h1>
          <p className="text-sm text-muted-foreground">
            Manage batch payment processing for approved invoices.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.finance.paymentRunNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Payment Run
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const isActive = (s === 'ALL' && !status) || status === s;
          const sp = new URLSearchParams();
          if (s !== 'ALL') sp.set('status', s);
          return (
            <Link key={s} href={`${routes.finance.paymentRuns}?${sp.toString()}`}>
              <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </Badge>
            </Link>
          );
        })}
      </div>

      <ApPaymentRunTable data={runs} />

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={buildHref}
      />
    </div>
  );
}

export default async function PaymentRunsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const page = typeof params.page === 'string' ? params.page : '1';
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<TableSkeleton />}>
      <PaymentRunsContent ctx={ctx} status={status} page={page} />
    </Suspense>
  );
}

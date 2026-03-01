import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getHolds } from '@/features/finance/payables/queries/ap-hold.queries';
import { ApHoldTable } from '@/features/finance/payables/blocks/ap-hold-table';
import { ApHoldFilters } from '@/features/finance/payables/blocks/ap-hold-filters';
import { Pagination } from '@/components/erp/pagination';
import { TableSkeleton } from '@/components/erp/loading-skeleton';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Payables — Holds' };

const PAGE_SIZE = 20;

export default async function HoldsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const holdType = typeof params.holdType === 'string' ? params.holdType : undefined;
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : undefined;
  const fromDate = typeof params.fromDate === 'string' ? params.fromDate : undefined;
  const toDate = typeof params.toDate === 'string' ? params.toDate : undefined;
  const page = typeof params.page === 'string' ? params.page : '1';

  const ctx = await getRequestContext();
  const result = await getHolds(ctx, {
    status: status === 'ALL' ? undefined : status,
    holdType: holdType === 'ALL' ? undefined : holdType,
    supplierId, fromDate, toDate, page, limit: String(PAGE_SIZE),
  });

  const holds = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Holds</h1>
        <p className="text-sm text-muted-foreground">View and manage holds on AP invoices.</p>
      </div>

      <ApHoldFilters status={status} holdType={holdType} supplierId={supplierId} fromDate={fromDate} toDate={toDate} />

      <Suspense fallback={<TableSkeleton />}>
        <ApHoldTable data={holds} />
      </Suspense>

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={(nextPage) => {
          const sp = new URLSearchParams();
          if (status && status !== 'ALL') sp.set('status', status);
          if (holdType && holdType !== 'ALL') sp.set('holdType', holdType);
          if (supplierId) sp.set('supplierId', supplierId);
          if (fromDate) sp.set('fromDate', fromDate);
          if (toDate) sp.set('toDate', toDate);
          sp.set('page', String(nextPage));
          return `${routes.finance.holds}?${sp.toString()}`;
        }}
      />
    </div>
  );
}

import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getHolds } from '@/features/finance/payables/queries/ap-hold.queries';
import { ApDuplicateReviewTable } from '@/features/finance/payables/blocks/ap-duplicate-review-table';
import { Pagination } from '@/components/erp/pagination';
import { TableSkeleton } from '@/components/erp/loading-skeleton';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Payables — Duplicate Review' };

const PAGE_SIZE = 20;

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? params.page : '1';

  const ctx = await getRequestContext();
  const result = await getHolds(ctx, {
    holdType: 'DUPLICATE',
    status: 'ACTIVE',
    page,
    limit: String(PAGE_SIZE),
  });

  const holds = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Duplicate Invoice Review</h1>
        <p className="text-sm text-muted-foreground">
          Review and release potential duplicate invoices. Side-by-side comparison available.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ApDuplicateReviewTable data={holds} />
      </Suspense>

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={(nextPage) => {
          const sp = new URLSearchParams();
          sp.set('page', String(nextPage));
          return `${routes.finance.duplicates}?${sp.toString()}`;
        }}
      />
    </div>
  );
}

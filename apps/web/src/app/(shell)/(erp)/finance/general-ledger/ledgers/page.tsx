import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { LedgerTable } from '@/features/finance/ledgers/blocks/ledger-table';
import { BookOpen } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Ledgers' };

export default async function LedgersPage({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const result = await getLedgers(ctx, { page: params.page ?? '1', limit: params.limit ?? '25' });
  if (!result.ok) handleApiError(result, 'Failed to load ledgers');
  const { data: ledgers, total, page, limit } = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader title="Ledgers" description="Manage general ledgers for each company entity." breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Ledgers' }]} />

      {ledgers.length === 0 ? (
        <EmptyState contentKey="finance.ledgers" icon={BookOpen} />
      ) : (
        <LedgerTable data={ledgers} />
      )}

      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => `${routes.finance.ledgers}?page=${p}`} />
    </div>
  </Suspense>
  );
}

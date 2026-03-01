import Link from 'next/link';
import { IcTransactionTable } from './ic-transaction-table';
import { EmptyState } from '@/components/erp/empty-state';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getIcTransactions } from '@/features/finance/intercompany/queries/ic.queries';
import { IC_STATUSES } from './ic-list-config';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Plus } from 'lucide-react';

type Params = { status?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export async function IcListSection({ params }: { params: Params }) {
  const ctx = await getRequestContext();
  const result = await getIcTransactions(ctx, { status: params.status, page: params.page ?? '1', limit: params.limit ?? '20' });
  if (!result.ok) handleApiError(result, 'Failed to load intercompany transactions');
  const { data: transactions, total, page, limit } = result.value;

  return (
    <>
      <ListFilterBar
        baseUrl={routes.finance.icTransactions}
        statuses={IC_STATUSES}
        currentStatus={params.status}
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search IC transactions…"
        dateRange
        currentFromDate={params.from}
        currentToDate={params.to}
      />
      {transactions.length > 0 ? (
        <IcTransactionTable data={transactions} />
      ) : (
        <EmptyState
          contentKey="finance.intercompany"
          icon={ArrowLeftRight}
          action={
            <Button asChild>
              <Link href={routes.finance.icTransactionNew}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create IC Transaction</Link>
            </Button>
          }
        />
      )}
      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => buildListHref(routes.finance.icTransactions, params, p)} />
    </>
  );
}

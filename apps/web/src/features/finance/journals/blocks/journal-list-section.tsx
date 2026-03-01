import { JournalTable } from './journal-table';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getJournals } from '@/features/finance/journals/queries/journal.queries';
import { JOURNAL_STATUSES } from './journal-list-config';
import { routes } from '@/lib/constants';

type Params = { status?: string; periodId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export async function JournalListSection({ params }: { params: Params }) {
  const ctx = await getRequestContext();
  const result = await getJournals(ctx, { periodId: params.periodId, status: params.status, page: params.page ?? '1', limit: params.limit ?? '20' });
  if (!result.ok) handleApiError(result, 'Failed to load journals');
  const { data: journals, total, page, limit } = result.value;

  return (
    <>
      <ListFilterBar
        baseUrl={routes.finance.journals}
        statuses={JOURNAL_STATUSES}
        currentStatus={params.status}
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search journals…"
        dateRange
        currentFromDate={params.from}
        currentToDate={params.to}
        preserveParams={{ periodId: params.periodId }}
      />
      <JournalTable data={journals} total={total} />
      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => buildListHref(routes.finance.journals, params, p)} />
    </>
  );
}

import { AccountTable } from './account-table';
import { EmptyState } from '@/components/erp/empty-state';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getAccounts } from '@/features/finance/accounts/queries/account.queries';
import { ACCOUNT_TYPES } from './account-list-config';
import { routes } from '@/lib/constants';
import { List } from 'lucide-react';

type Params = { type?: string; active?: string; q?: string; page?: string; limit?: string };

export async function AccountListSection({ params }: { params: Params }) {
  const ctx = await getRequestContext();
  const result = await getAccounts(ctx, {
    type: params.type,
    active: params.active,
    page: params.page ?? '1',
    limit: params.limit ?? '50',
  });
  if (!result.ok) handleApiError(result, 'Failed to load accounts');
  const { data: accounts, total, page, limit } = result.value;

  return (
    <>
      <ListFilterBar
        baseUrl={routes.finance.accounts}
        statuses={ACCOUNT_TYPES}
        currentStatus={params.type}
        filterKey="type"
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search accounts…"
        preserveParams={{ active: params.active }}
      />
      {accounts.length > 0 ? (
        <AccountTable data={accounts} />
      ) : (
        <EmptyState contentKey="finance.accounts" constraint="table" icon={List} />
      )}
      <Pagination
        page={page}
        pageSize={limit}
        totalCount={total}
        buildHref={(p) => buildListHref(routes.finance.accounts, params, p)}
      />
    </>
  );
}

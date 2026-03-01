import { RecurringTemplateTable } from './recurring-template-table';
import { EmptyState } from '@/components/erp/empty-state';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getRecurringTemplates } from '@/features/finance/recurring/queries/recurring.queries';
import { ACTIVE_OPTIONS } from './recurring-list-config';
import { routes } from '@/lib/constants';
import { RefreshCw } from 'lucide-react';

type Params = { active?: string; q?: string; page?: string; limit?: string };

export async function RecurringListSection({ params }: { params: Params }) {
  const ctx = await getRequestContext();
  const result = await getRecurringTemplates(ctx, { active: params.active, page: params.page ?? '1', limit: params.limit ?? '25' });
  if (!result.ok) handleApiError(result, 'Failed to load recurring templates');
  const { data: templates, total, page, limit } = result.value;

  return (
    <>
      <ListFilterBar
        baseUrl={routes.finance.recurring}
        statuses={ACTIVE_OPTIONS}
        currentStatus={params.active}
        filterKey="active"
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search templates…"
      />
      {templates.length === 0 ? <EmptyState contentKey="finance.recurring" icon={RefreshCw} /> : <RecurringTemplateTable data={templates} />}
      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => buildListHref(routes.finance.recurring, params, p)} />
    </>
  );
}

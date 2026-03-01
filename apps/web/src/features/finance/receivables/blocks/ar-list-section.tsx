import { ArInvoiceTable } from './ar-invoice-table';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getArInvoices } from '@/features/finance/receivables/queries/ar.queries';
import { AR_STATUSES } from './ar-list-config';
import { routes } from '@/lib/constants';

type Params = { status?: string; customerId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export async function ArListSection({ params }: { params: Params }) {
  const ctx = await getRequestContext();
  const result = await getArInvoices(ctx, { status: params.status, customerId: params.customerId, page: params.page ?? '1', limit: params.limit ?? '20' });
  if (!result.ok) handleApiError(result, 'Failed to load receivable invoices');
  const { data: invoices, total, page, limit } = result.value;

  return (
    <>
      <ListFilterBar
        baseUrl={routes.finance.receivables}
        statuses={AR_STATUSES}
        currentStatus={params.status}
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search invoices…"
        dateRange
        currentFromDate={params.from}
        currentToDate={params.to}
        preserveParams={{ customerId: params.customerId }}
      />
      <ArInvoiceTable data={invoices} total={total} />
      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => buildListHref(routes.finance.receivables, params, p)} />
    </>
  );
}

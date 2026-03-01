import { ApInvoiceTable } from './ap-invoice-table';
import { ListFilterBar } from '@/components/erp/list-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildListHref } from '@/lib/build-list-href';
import { getApInvoices } from '@/features/finance/payables/queries/ap.queries';
import { AP_STATUSES } from './ap-list-config';
import { routes } from '@/lib/constants';

type Params = { status?: string; supplierId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export async function ApListSection({
  params,
  baseUrl = routes.finance.payables,
  statusLocked,
}: {
  params: Params;
  baseUrl?: string;
  /** When set, only show this status option (e.g. triage page) */
  statusLocked?: string;
}) {
  const ctx = await getRequestContext();
  const result = await getApInvoices(ctx, { status: params.status ?? statusLocked, supplierId: params.supplierId, page: params.page ?? '1', limit: params.limit ?? '20' });
  if (!result.ok) handleApiError(result, 'Failed to load payable invoices');
  const { data: invoices, total, page, limit } = result.value;

  const statuses = statusLocked
    ? [{ value: statusLocked, label: 'Incomplete (Triage)' }]
    : AP_STATUSES;

  return (
    <>
      <ListFilterBar
        baseUrl={baseUrl}
        statuses={statuses}
        currentStatus={params.status ?? statusLocked}
        searchable
        currentSearch={params.q}
        searchPlaceholder="Search invoices…"
        dateRange
        currentFromDate={params.from}
        currentToDate={params.to}
        preserveParams={{ supplierId: params.supplierId }}
      />
      <ApInvoiceTable data={invoices} total={total} />
      <Pagination page={page} pageSize={limit} totalCount={total} buildHref={(p) => buildListHref(baseUrl, { ...params, status: params.status ?? statusLocked }, p)} />
    </>
  );
}

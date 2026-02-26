import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { ApInvoiceTable } from '@/features/finance/payables/blocks/ap-invoice-table';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getApInvoices } from '@/features/finance/payables/queries/ap.queries';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Payables' };

interface PayablesPageProps {
  searchParams: Promise<{
    status?: string;
    supplierId?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function PayablesPage({ searchParams }: PayablesPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getApInvoices(ctx, {
    status: params.status,
    supplierId: params.supplierId,
    page: params.page ?? '1',
    limit: params.limit ?? '20',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load payable invoices');
  }

  const invoices = result.value.data;
  const total = result.value.total;
  const page = result.value.page;
  const limit = result.value.limit;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payables"
        description="Accounts payable invoices from suppliers."
        breadcrumbs={[{ label: 'Finance', href: '/finance/payables' }, { label: 'Payables' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.payableNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Invoice
            </Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <ApListFilters currentStatus={params.status} currentPage={page} totalPages={totalPages} />

      <ApInvoiceTable data={invoices} total={total} />
    </div>
  );
}

// ─── Filter bar (server-rendered links for zero JS) ─────────────────────────

function ApListFilters({
  currentStatus,
  currentPage,
  totalPages,
}: {
  currentStatus?: string;
  currentPage: number;
  totalPages: number;
}) {
  const statuses = [
    { value: undefined, label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_APPROVAL', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'POSTED', label: 'Posted' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIALLY_PAID', label: 'Partial' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  function buildUrl(overrides: { status?: string; page?: number }) {
    const params = new URLSearchParams();
    const status = overrides.status ?? currentStatus;
    if (status) params.set('status', status);
    const p = overrides.page ?? currentPage;
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/finance/payables?${qs}` : '/finance/payables';
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {statuses.map((s) => {
          const isActive = s.value === currentStatus || (!s.value && !currentStatus);
          return (
            <Link
              key={s.label}
              href={buildUrl({ status: s.value, page: 1 })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl({ page: currentPage - 1 })}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl({ page: currentPage + 1 })}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

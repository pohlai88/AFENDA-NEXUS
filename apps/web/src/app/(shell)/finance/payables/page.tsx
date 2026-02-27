import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { ApInvoiceTable } from '@/features/finance/payables/blocks/ap-invoice-table';
import { Pagination } from '@/components/erp/pagination';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payables"
        description="Accounts payable invoices from suppliers."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.payables }, { label: 'Payables' }]}
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
      <ApStatusFilters currentStatus={params.status} />

      <ApInvoiceTable data={invoices} total={total} />

      <Pagination
        page={page}
        pageSize={limit}
        totalCount={total}
        buildHref={(nextPage) => {
          const p = new URLSearchParams();
          if (params.status) p.set('status', params.status);
          if (params.supplierId) p.set('supplierId', params.supplierId);
          if (nextPage > 1) p.set('page', String(nextPage));
          const qs = p.toString();
          return qs ? `${routes.finance.payables}?${qs}` : routes.finance.payables;
        }}
      />
    </div>
  );
}

// ─── Status filter bar (server-rendered links for zero JS) ──────────────────

function ApStatusFilters({ currentStatus }: { currentStatus?: string }) {
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

  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((s) => {
        const isActive = s.value === currentStatus || (!s.value && !currentStatus);
        const params = new URLSearchParams();
        if (s.value) params.set('status', s.value);
        const qs = params.toString();
        const href = qs ? `${routes.finance.payables}?${qs}` : routes.finance.payables;
        return (
          <Link
            key={s.label}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}

import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getIcTransactions } from '@/features/finance/intercompany/queries/ic.queries';
import { IcTransactionTable } from '@/features/finance/intercompany/blocks/ic-transaction-table';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Plus } from 'lucide-react';

export const metadata = { title: 'Intercompany Transactions' };

interface IcTransactionsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function IcTransactionsPage({ searchParams }: IcTransactionsPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getIcTransactions(ctx, {
    status: params.status,
    page: params.page ?? '1',
    limit: params.limit ?? '20',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load intercompany transactions');
  }

  const transactions = result.value.data;
  const total = result.value.total;
  const page = result.value.page;
  const limit = result.value.limit;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intercompany Transactions"
        description="Paired journal entries between companies within the same tenant."
        breadcrumbs={[{ label: 'Finance', href: '/finance/journals' }, { label: 'Intercompany' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.icTransactionNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create IC Transaction
            </Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <IcFilters currentStatus={params.status} currentPage={page} totalPages={totalPages} />

      {/* Data table */}
      {transactions.length > 0 && <IcTransactionTable data={transactions} />}

      {/* Empty state */}
      {transactions.length === 0 && (
        <EmptyState
          title="No IC transactions"
          description="No intercompany transactions found. Create one to get started."
          icon={ArrowLeftRight}
          action={
            <Button asChild>
              <Link href={routes.finance.icTransactionNew}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Create IC Transaction
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

// ─── Filter bar (server-rendered links) ─────────────────────────────────────

function IcFilters({
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
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAIRED', label: 'Paired' },
    { value: 'RECONCILED', label: 'Reconciled' },
  ];

  function buildUrl(overrides: { status?: string; page?: number }) {
    const p = new URLSearchParams();
    const status = overrides.status ?? currentStatus;
    if (status) p.set('status', status);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set('page', String(pg));
    const qs = p.toString();
    return qs ? `/finance/intercompany?${qs}` : '/finance/intercompany';
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1">
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

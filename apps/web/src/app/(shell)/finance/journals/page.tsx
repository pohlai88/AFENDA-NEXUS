import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { JournalTable } from '@/features/finance/journals/blocks/journal-table';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getJournals } from '@/features/finance/journals/queries/journal.queries';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Journals' };

interface JournalsPageProps {
  searchParams: Promise<{
    status?: string;
    periodId?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function JournalsPage({ searchParams }: JournalsPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getJournals(ctx, {
    periodId: params.periodId,
    status: params.status,
    page: params.page ?? '1',
    limit: params.limit ?? '20',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load journals');
  }

  const journals = result.value.data;
  const total = result.value.total;
  const page = result.value.page;
  const limit = result.value.limit;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journals"
        description="General ledger journal entries."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Journals' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.journalNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Journal
            </Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <JournalListFilters
        currentStatus={params.status}
        currentPage={page}
        totalPages={totalPages}
      />

      <JournalTable data={journals} total={total} />
    </div>
  );
}

// ─── Filter bar (server-rendered links for zero JS) ─────────────────────────

function JournalListFilters({
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
    { value: 'POSTED', label: 'Posted' },
    { value: 'REVERSED', label: 'Reversed' },
    { value: 'VOIDED', label: 'Voided' },
  ];

  function buildUrl(overrides: { status?: string; page?: number }) {
    const params = new URLSearchParams();
    const status = overrides.status ?? currentStatus;
    if (status) params.set('status', status);
    const p = overrides.page ?? currentPage;
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${routes.finance.journals}?${qs}` : routes.finance.journals;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Status tabs */}
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

      {/* Pagination */}
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

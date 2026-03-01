import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getBudgetEntries } from '@/features/finance/budgets/queries/budget.queries';
import { BudgetEntryTable } from '@/features/finance/budgets/blocks/budget-entry-table';
import { BudgetCreateSection, BudgetPagination } from '@/features/finance/budgets/blocks/budget-page-blocks';
import { routes } from '@/lib/constants';
import { Target } from 'lucide-react';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Budget Entries | Finance' };

const breadcrumbs = [
  { label: 'Finance', href: routes.finance.journals },
  { label: 'Budget Entries' },
];

interface Props { searchParams: Promise<{ ledgerId?: string; periodId?: string; page?: string; limit?: string }> }

export default async function BudgetEntriesPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  // Require ledgerId and periodId filters
  if (!params.ledgerId || !params.periodId) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <PageHeader title="Budget Entries" description="Manage budget allocations by account and period." breadcrumbs={breadcrumbs} />
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          Select a <strong>Ledger</strong> and <strong>Period</strong> to view budget entries.
          Use the URL parameters <code>?ledgerId=&amp;periodId=</code> to filter.
        </div>
        <BudgetCreateSection />
      </div>
    </Suspense>
    );
  }

  const result = await getBudgetEntries(ctx, {
    ledgerId: params.ledgerId,
    periodId: params.periodId,
    page: params.page ?? '1',
    limit: params.limit ?? '50',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load budget entries');
  }

  const entries = result.value.data;
  const { total, page, limit } = result.value;
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="space-y-6">
      <PageHeader title="Budget Entries" description="Manage budget allocations by account and period." breadcrumbs={breadcrumbs} />

      <BudgetCreateSection defaultValues={{ ledgerId: params.ledgerId, periodId: params.periodId }} />

      {entries.length === 0 ? (
        <EmptyState contentKey="finance.budgetEntries" icon={Target} />
      ) : (
        <BudgetEntryTable entries={entries} />
      )}

      <BudgetPagination page={page} totalPages={totalPages} total={total} ledgerId={params.ledgerId} periodId={params.periodId} />
    </div>
  );
}

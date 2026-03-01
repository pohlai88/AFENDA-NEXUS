import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getExpenseClaim } from '@/features/finance/expenses/queries/expenses.queries';
import { ExpenseDetailHeader, ExpenseOverview } from '@/features/finance/expenses/blocks/expense-detail';
import { ExpenseLinesSection } from '@/features/finance/expenses/blocks/expense-sections';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getExpenseClaim(ctx, id);
  if (!result.ok) return { title: 'Expense Claim | Finance' };
  return { title: `${result.value.claimNumber} | Expenses` };
}

export default async function ExpenseDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getExpenseClaim(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load expense claim');
  }

  const claim = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${claim.claimNumber} — ${claim.title}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Expenses', href: routes.finance.expenses },
          { label: claim.claimNumber },
        ]}
      />
      <BusinessDocument
        header={<ExpenseDetailHeader claim={claim} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <ExpenseOverview claim={claim} /> },
          {
            value: 'lines',
            label: 'Expense Lines',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <ExpenseLinesSection claimId={claim.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}

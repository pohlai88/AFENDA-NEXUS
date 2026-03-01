import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getExpensePolicies } from '@/features/finance/expenses/queries/expenses.queries';
import { ExpensePoliciesList } from '@/features/finance/expenses/blocks/expense-policies-list';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Expense Policies | Finance' };

export default async function ExpensePoliciesPage() {
  const ctx = await getRequestContext();
  const result = await getExpensePolicies(ctx);

  if (!result.ok) {
    handleApiError(result, 'Failed to load expense policies');
  }

  const policies = result.value.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Expense Policies"
        description="Policies that control expense claim validation."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Expenses', href: routes.finance.expenses },
          { label: 'Policies' },
        ]}
      />

      {policies.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No expense policies configured.</CardContent></Card>
      ) : (
        <ExpensePoliciesList policies={policies} />
      )}
    </div>
  </Suspense>
  );
}

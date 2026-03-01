import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { getRequestContext } from '@/lib/auth';
import { getExpensePolicy } from '@/features/finance/expenses/queries/expenses.queries';
import { ExpenseClaimForm } from '@/features/finance/expenses/blocks/expense-claim-form';
import type { ExpensePolicy } from '@/features/finance/expenses/types';

export const metadata = {
  title: 'New Expense Claim | Finance | Afenda',
  description: 'Create a new expense claim',
};

export default async function NewExpenseClaimPage() {
  const ctx = await getRequestContext();
  const policyResult = await getExpensePolicy(ctx);

  if (!policyResult.ok) {
    throw new Error(policyResult.error.message);
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex flex-col gap-6 max-w-4xl">
        <PageHeader>
          <PageHeaderHeading>New Expense Claim</PageHeaderHeading>
          <PageHeaderDescription>
            Submit expenses for reimbursement. All claims are subject to approval based on company
            policy.
          </PageHeaderDescription>
        </PageHeader>

        <ExpenseClaimForm policy={policyResult.value as unknown as ExpensePolicy} />
      </div>
    </Suspense>
  );
}

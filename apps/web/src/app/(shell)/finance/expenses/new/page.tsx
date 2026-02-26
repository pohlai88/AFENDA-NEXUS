import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { getExpensePolicy } from '@/features/finance/expenses/queries/expenses.queries';
import { ExpenseClaimForm } from '@/features/finance/expenses/blocks/expense-claim-form';

export const metadata = {
  title: 'New Expense Claim | Finance | Afenda',
  description: 'Create a new expense claim',
};

export default async function NewExpenseClaimPage() {
  const policyResult = await getExpensePolicy();

  if (!policyResult.ok) {
    throw new Error(policyResult.error);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader>
        <PageHeaderHeading>New Expense Claim</PageHeaderHeading>
        <PageHeaderDescription>
          Submit expenses for reimbursement. All claims are subject to approval based on company policy.
        </PageHeaderDescription>
      </PageHeader>

      <ExpenseClaimForm policy={policyResult.data} />
    </div>
  );
}

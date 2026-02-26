import { PageHeader } from '@/components/erp/page-header';
import { AccountForm } from '@/features/finance/accounts/forms/account-form';
import { createAccountAction } from '@/features/finance/accounts/actions/account.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Account' };

export default function NewAccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Account"
        description="Add a new account to the chart of accounts."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Accounts', href: routes.finance.accounts },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <AccountForm onSubmit={createAccountAction} />
      </div>
    </div>
  );
}

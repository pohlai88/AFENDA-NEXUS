import { PageHeader } from '@/components/erp/page-header';
import { SetCreditLimitForm } from '@/features/finance/credit/forms/set-credit-limit-form';
import { setCreditLimitAction } from '@/features/finance/credit/actions/credit.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Set Credit Limit | Finance' };

export default function NewCreditLimitPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Set Credit Limit"
        description="Configure credit limit, payment terms, and review frequency for a customer."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Credit Management', href: routes.finance.creditLimits },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <SetCreditLimitForm onSubmit={setCreditLimitAction} />
      </div>
    </div>
  );
}

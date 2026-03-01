import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { CreatePolicyForm } from '@/features/finance/transfer-pricing/forms/create-policy-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Transfer Pricing — New' };

export default function TransferPricingNewPage() {
  return (
    <>
      <PageHeader
        title="New Transfer Pricing Policy"
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.root },
          { label: 'Transfer Pricing', href: routes.finance.transferPricing },
          { label: 'New Policy' },
        ]}
      />
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading form…</div>}>
        <div className="mx-auto max-w-2xl p-6">
          <CreatePolicyForm />
        </div>
      </Suspense>
    </>
  );
}

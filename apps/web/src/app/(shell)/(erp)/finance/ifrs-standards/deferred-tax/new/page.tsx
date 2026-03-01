import { PageHeader } from '@/components/erp/page-header';
import { CreateDeferredTaxItemForm } from '@/features/finance/deferred-tax/forms/create-deferred-tax-item-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Deferred Tax — New' };

export default function DeferredTaxNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Deferred Tax Item"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Deferred Tax', href: routes.finance.deferredTax },
          { label: 'New' },
        ]}
      />
      <div className="mx-auto max-w-2xl rounded-lg border p-6">
        <CreateDeferredTaxItemForm />
      </div>
    </div>
  );
}

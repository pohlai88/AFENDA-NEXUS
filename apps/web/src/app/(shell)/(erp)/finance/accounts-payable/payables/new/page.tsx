import { PageHeader } from '@/components/erp/page-header';
import { ApInvoiceForm } from '@/features/finance/payables/forms/ap-invoice-form';
import { createApInvoiceAction } from '@/features/finance/payables/actions/ap.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Payable Invoice' };

export default function NewPayablePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create AP Invoice"
        description="Draft a new accounts payable invoice."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Payables', href: routes.finance.payables },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <ApInvoiceForm onSubmit={createApInvoiceAction} />
      </div>
    </div>
  );
}

import { PageHeader } from '@/components/erp/page-header';
import { ArInvoiceForm } from '@/features/finance/receivables/forms/ar-invoice-form';
import { createArInvoiceAction } from '@/features/finance/receivables/actions/ar.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Receivable Invoice' };

export default function NewReceivablePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create AR Invoice"
        description="Draft a new accounts receivable invoice."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <ArInvoiceForm onSubmit={createArInvoiceAction} />
      </div>
    </div>
  );
}

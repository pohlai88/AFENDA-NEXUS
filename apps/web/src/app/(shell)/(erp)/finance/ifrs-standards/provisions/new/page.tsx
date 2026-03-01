import { PageHeader } from '@/components/erp/page-header';
import { CreateProvisionForm } from '@/features/finance/provisions/forms/create-provision-form';
import { createProvisionAction } from '@/features/finance/provisions/actions/provisions.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Provision | Finance' };

export default function NewProvisionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Provision"
        description="Recognise a new provision under IAS 37."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Provisions', href: routes.finance.provisions },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateProvisionForm onSubmit={createProvisionAction} />
      </div>
    </div>
  );
}

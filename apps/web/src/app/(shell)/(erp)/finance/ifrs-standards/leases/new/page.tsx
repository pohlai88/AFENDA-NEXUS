import { PageHeader } from '@/components/erp/page-header';
import { CreateLeaseForm } from '@/features/finance/leases/forms/create-lease-form';
import { createLease } from '@/features/finance/leases/actions/leases.actions';
import { routes } from '@/lib/constants';
import type { CreateLeaseInput } from '@afenda/contracts';

export const metadata = { title: 'New Lease | Finance' };

async function handleCreate(data: Record<string, unknown>) {
  'use server';
  return createLease(data as unknown as CreateLeaseInput);
}

export default function NewLeasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Lease Contract"
        description="Register a new lease under IFRS 16."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Leases', href: routes.finance.leases },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateLeaseForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
